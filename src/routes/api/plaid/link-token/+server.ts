import { json, error as kitError } from '@sveltejs/kit';
import { CountryCode, Products } from 'plaid';
import type { RequestHandler } from './$types';
import { plaidClient } from '$lib/server/plaid/client';
import { PLAID_WEBHOOK_URL } from '$env/static/private';
import { checkRateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const allowed = await checkRateLimit(`plaid_link:${user.id}`, 20, 60 * 60);
	if (!allowed) kitError(429, 'Too many requests. Try again later.');

	const response = await plaidClient.linkTokenCreate({
		user: { client_user_id: user.id },
		client_name: 'Perfinia',
		products: [Products.Transactions],
		country_codes: [CountryCode.Us],
		language: 'en',
		transactions: { days_requested: 730 },
		...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {})
	});

	return json({ linkToken: response.data.link_token });
};
