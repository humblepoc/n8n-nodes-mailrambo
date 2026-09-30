import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class MailRamboApi implements ICredentialType {
	name = 'mailRamboApi';

	displayName = 'MailRambo API';

	icon: Icon = { light: 'file:../nodes/MailRambo/mailrambo.svg', dark: 'file:../nodes/MailRambo/mailrambo.dark.svg' };

	documentationUrl = 'https://www.mailrambo.com/developers#authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'mr_live_... or mr_test_...',
			description:
				'Create a key at https://www.mailrambo.com/api-keys. Test keys (mr_test_) are free and return canned answers.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://www.mailrambo.com',
			url: '/v1/account',
		},
	};
}
