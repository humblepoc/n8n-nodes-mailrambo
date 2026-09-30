# n8n-nodes-mailrambo

An [n8n](https://n8n.io) community node for [MailRambo](https://www.mailrambo.com): email verification with a strict yes/no answer.

Each address comes back with `deliverable: true/false` and a `reason`:
`mailbox_exists`, `role_account`, `disposable`, `catch_all`, `mailbox_not_found`, `spamtrap`, `inbox_full`, `mailbox_disabled`, `unverifiable` or `invalid_syntax`. Catch-all and unverifiable addresses count as "no", so uncertain addresses never reach your campaigns.

## Install

In n8n: **Settings > Community Nodes > Install** > `n8n-nodes-mailrambo`.

For self-hosted n8n, run `npm install n8n-nodes-mailrambo` in your `~/.n8n/custom` folder and restart n8n.

## Credentials

Create an API key at <https://www.mailrambo.com/api-keys> and add it as a **MailRambo API** credential.

- `mr_live_...` keys make real checks and use 1 credit per address.
- `mr_test_...` keys are free and return canned answers for building workflows: `deliverable@...`, `disposable@...`, `catch_all@...`, `not_found@...` and so on.

Every account gets 100 free checks a month. Plans start at $5 for 1,000 checks, and credit packs start at $9 for 2,000 and never expire.

## Operations

| Operation | What it does |
|---|---|
| **Verify Email** | Checks one address. **Mode: Full** (default, 1 credit) confirms the mailbox; turn on **Full Detail** to also get the A-F lead grade, inbox provider, flags and SPF/DKIM/DMARC/BIMI/PTR results at the same price. **Mode: Fast** is free and sub-second: syntax, typo suggestions, MX, disposable and role flags. It returns `deliverable: false` or `null` (never `true`), so use it as a pre-filter. |
| **Start Batch** | Submits up to 200 addresses (separated by commas, spaces or new lines, or an array expression) and returns a `batch_id`. |
| **Get Batch** | Polls a batch; `results` appear when `status` is `completed`. |
| **Get Account** | Shows your plan and remaining credits (free). |

Repeating the same address from the same account within 24 hours is free and returns `"cached": true`.

The node can also be used as a tool by n8n AI agents.

## Example: clean a lead list before a campaign

1. **Google Sheets > Read rows** (your lead list)
2. **MailRambo > Verify Email**, Mode **Fast**, Email = `{{ $json.email }}`. Drop rows where `deliverable` is `false` (free).
3. **MailRambo > Verify Email**, Mode **Full**, for the rest.
4. **IF** `{{ $json.deliverable }}` is true: send to your email tool. Otherwise, write the row and `{{ $json.reason }}` to a "removed" sheet.

For large lists, use **Start Batch**, then **Wait** (about 30 s), then **Get Batch**, looping until `status` is `completed`.

## Develop

```bash
npm install
npm run lint
npm run build
npm test
npm run dev   # starts a local n8n with this node loaded
```

## Release (maintainers)

Releases are published by GitHub Actions with an npm provenance statement, as n8n requires for verified nodes:

1. Bump `version` in `package.json` and commit.
2. Tag and push: `git tag 0.1.2 && git push origin main 0.1.2`.
3. The **Publish** workflow lints, builds, tests and runs `npm publish --provenance`. It authenticates with npm Trusted Publishing, so no token is stored.

## License

MIT
