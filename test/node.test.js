// Structural tests for the built node (run `npm run build` first).
// They check what n8n relies on: package wiring, credential auth, and that the
// routing expressions produce requests matching the MailRambo /v1 contract.
const { test } = require('node:test');
const assert = require('node:assert');
const { existsSync } = require('node:fs');
const pkg = require('../package.json');
const { MailRambo } = require('../dist/nodes/MailRambo/MailRambo.node.js');
const { MailRamboApi } = require('../dist/credentials/MailRamboApi.credentials.js');

const desc = new MailRambo().description;
const ops = Object.fromEntries(desc.properties[0].options.map((o) => [o.value, o]));

// Minimal evaluator for the "={{ ... }}" expressions used in routing.
function evalExpr(expr, params) {
	if (typeof expr !== 'string' || !expr.startsWith('=')) return expr;
	const body = expr.slice(1);
	const whole = /^\{\{([\s\S]*)\}\}$/.exec(body.trim());
	const run = (code) => new Function('$parameter', `return (${code});`)(params);
	if (whole) return run(whole[1]);
	return body.replace(/\{\{([\s\S]*?)\}\}/g, (_, code) => String(run(code)));
}

test('package.json is a valid n8n community package', () => {
	assert.match(pkg.name, /^n8n-nodes-/);
	assert.ok(pkg.keywords.includes('n8n-community-node-package'));
	assert.deepStrictEqual(Object.keys(pkg.dependencies || {}), []);
	for (const f of [...pkg.n8n.nodes, ...pkg.n8n.credentials]) assert.ok(existsSync(f), f);
	assert.ok(existsSync('dist/nodes/MailRambo/mailrambo.svg'));
	assert.ok(existsSync('dist/nodes/MailRambo/mailrambo.dark.svg'));
});

test('credential sends a Bearer key and tests against /v1/account', () => {
	const cred = new MailRamboApi();
	assert.strictEqual(cred.name, desc.credentials[0].name);
	assert.strictEqual(cred.authenticate.properties.headers.Authorization, '=Bearer {{$credentials.apiKey}}');
	assert.strictEqual(cred.test.request.url, '/v1/account');
});

test('verify posts the email; mode and detail only when requested', () => {
	const r = ops.verify.routing.request;
	assert.strictEqual(r.method, 'POST');
	assert.strictEqual(r.url, '/v1/verify');
	const body = (p) => JSON.parse(JSON.stringify(Object.fromEntries(
		Object.entries(r.body).map(([k, v]) => [k, evalExpr(v, p)]))));
	assert.deepStrictEqual(body({ email: 'a@b.com', mode: 'full', fullDetail: false }), { email: 'a@b.com' });
	assert.deepStrictEqual(body({ email: 'a@b.com', mode: 'full', fullDetail: true }), { email: 'a@b.com', detail: 'full' });
	// Fast mode never sends detail, even if the (hidden) toggle was left on.
	assert.deepStrictEqual(body({ email: 'a@b.com', mode: 'fast', fullDetail: true }), { email: 'a@b.com', mode: 'fast' });
});

test('start batch accepts a delimited string or an array', () => {
	const expr = ops.startBatch.routing.request.body.emails;
	assert.deepStrictEqual(evalExpr(expr, { emails: 'a@x.com, b@x.com\nc@x.com;  d@x.com ' }),
		['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']);
	assert.deepStrictEqual(evalExpr(expr, { emails: ['a@x.com', ' b@x.com '] }), ['a@x.com', 'b@x.com']);
	assert.strictEqual(evalExpr(ops.startBatch.routing.request.body.name, { batchName: '' }), undefined);
});

test('get batch URL-encodes the id; account is a GET', () => {
	assert.strictEqual(evalExpr(ops.getBatch.routing.request.url, { batchId: 'task 1/2' }), '/v1/verify/batch/task%201%2F2');
	assert.deepStrictEqual(ops.account.routing.request, { method: 'GET', url: '/v1/account' });
});
