import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class MailRambo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MailRambo',
		name: 'mailRambo',
		icon: { light: 'file:mailrambo.svg', dark: 'file:mailrambo.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Verify email addresses: strict yes/no deliverability with a reason (disposable, catch-all, not found...)',
		defaults: { name: 'MailRambo' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'mailRamboApi', required: true }],
		requestDefaults: {
			baseURL: 'https://www.mailrambo.com',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'verify',
				options: [
					{
						name: 'Verify Email',
						value: 'verify',
						action: 'Verify an email address',
						description: 'Check one address (1 credit; invalid syntax is free)',
						routing: {
							request: {
								method: 'POST',
								url: '/v1/verify',
								body: {
									email: '={{$parameter.email}}',
									mode: '={{$parameter.mode === "fast" ? "fast" : undefined}}',
									detail: '={{$parameter.mode !== "fast" && $parameter.fullDetail ? "full" : undefined}}',
								},
							},
						},
					},
					{
						name: 'Start Batch',
						value: 'startBatch',
						action: 'Start a batch verification',
						description: 'Submit up to 200 addresses; returns a batch ID to poll',
						routing: {
							request: {
								method: 'POST',
								url: '/v1/verify/batch',
								body: {
									emails: '={{ (Array.isArray($parameter.emails) ? $parameter.emails : String($parameter.emails).split(/[\\s,;]+/)).map(e => String(e).trim()).filter(e => e) }}',
									name: '={{$parameter.batchName || undefined}}',
								},
							},
						},
					},
					{
						name: 'Get Batch',
						value: 'getBatch',
						action: 'Get batch results',
						description: 'Poll a batch; results appear when status is "completed"',
						routing: {
							request: {
								method: 'GET',
								url: '=/v1/verify/batch/{{encodeURIComponent($parameter.batchId)}}',
							},
						},
					},
					{
						name: 'Get Account',
						value: 'account',
						action: 'Get account credits',
						description: 'Plan and remaining credits (free)',
						routing: {
							request: { method: 'GET', url: '/v1/account' },
						},
					},
				],
			},

			// Verify Email
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'jane@acme.com',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['verify'] } },
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				default: 'full',
				options: [
					{
						name: 'Full',
						value: 'full',
						description: 'Mailbox-level check with a strict yes/no answer (1 credit)',
					},
					{
						name: 'Fast',
						value: 'fast',
						description:
							'Free, sub-second pre-check: syntax, typos, MX, disposable and role flags. Deliverable is false or null, never true.',
					},
				],
				displayOptions: { show: { operation: ['verify'] } },
			},
			{
				displayName: 'Full Detail',
				name: 'fullDetail',
				type: 'boolean',
				default: false,
				description:
					'Whether to include the A-F lead grade, inbox provider, flags and SPF/DKIM/DMARC results (same 1 credit)',
				displayOptions: { show: { operation: ['verify'], mode: ['full'] } },
			},

			// Start Batch
			{
				displayName: 'Emails',
				name: 'emails',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				placeholder: 'jane@acme.com, info@corp.io',
				description:
					'Up to 200 addresses separated by commas, spaces or new lines, or an expression returning an array. The whole batch is rejected (and not charged) if any address is malformed.',
				displayOptions: { show: { operation: ['startBatch'] } },
			},
			{
				displayName: 'Batch Name',
				name: 'batchName',
				type: 'string',
				default: '',
				description: 'Optional label shown in your MailRambo history',
				displayOptions: { show: { operation: ['startBatch'] } },
			},

			// Get Batch
			{
				displayName: 'Batch ID',
				name: 'batchId',
				type: 'string',
				default: '',
				required: true,
				description: 'The batch_id returned by Start Batch',
				displayOptions: { show: { operation: ['getBatch'] } },
			},
		],
	};
}
