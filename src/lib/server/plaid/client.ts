import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV } from '$env/static/private';

const basePath =
	PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox;

const configuration = new Configuration({
	basePath,
	baseOptions: {
		// Axios defaults to no timeout: without this a stalled Plaid call hangs
		// the request forever with no error anywhere.
		timeout: 30_000,
		headers: {
			'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
			'PLAID-SECRET': PLAID_SECRET
		}
	}
});

export const plaidClient = new PlaidApi(configuration);
