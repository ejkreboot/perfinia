import { json, error as kitError } from '@sveltejs/kit';
import { CountryCode } from 'plaid';
import type { RequestHandler } from './$types';
import { plaidClient } from '$lib/server/plaid/client';
import { encryptToken } from '$lib/server/crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { syncItem, isAssetAccountType } from '$lib/server/plaid/sync';

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const body = await request.json();
	const publicToken = body?.public_token as string | undefined;
	if (!publicToken) kitError(400, 'Missing public_token');

	const exchangeResponse = await plaidClient.itemPublicTokenExchange({
		public_token: publicToken
	});
	const accessToken = exchangeResponse.data.access_token;
	const plaidItemId = exchangeResponse.data.item_id;

	const itemGetResponse = await plaidClient.itemGet({ access_token: accessToken });
	const institutionId = itemGetResponse.data.item.institution_id ?? null;

	let institutionName: string | null = null;
	if (institutionId) {
		const institutionResponse = await plaidClient.institutionsGetById({
			institution_id: institutionId,
			country_codes: [CountryCode.Us]
		});
		institutionName = institutionResponse.data.institution.name;
	}

	const { ciphertext, iv, tag } = encryptToken(accessToken);

	const { data: itemRow, error: itemError } = await supabaseAdmin
		.from('plaid_items')
		.insert({
			user_id: user.id,
			plaid_item_id: plaidItemId,
			institution_id: institutionId,
			institution_name: institutionName,
			access_token_ciphertext: ciphertext,
			access_token_iv: iv,
			access_token_tag: tag,
			status: 'active'
		})
		.select('id')
		.single();

	if (itemError || !itemRow) {
		kitError(500, itemError?.message ?? 'Failed to store Plaid item');
	}

	const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
	const today = new Date().toISOString().slice(0, 10);

	for (const acct of accountsResponse.data.accounts) {
		const { data: accountRow } = await supabaseAdmin
			.from('accounts')
			.upsert(
				{
					user_id: user.id,
					plaid_item_id: itemRow.id,
					plaid_account_id: acct.account_id,
					name: acct.name,
					official_name: acct.official_name,
					type: acct.type,
					subtype: acct.subtype,
					mask: acct.mask,
					is_manual: false,
					is_asset: isAssetAccountType(acct.type),
					current_balance: acct.balances.current,
					available_balance: acct.balances.available,
					credit_limit: acct.balances.limit,
					iso_currency_code: acct.balances.iso_currency_code ?? 'USD'
				},
				{ onConflict: 'plaid_account_id' }
			)
			.select('id')
			.single();

		if (!accountRow) continue;

		await supabaseAdmin.from('balance_snapshots').upsert(
			{
				account_id: accountRow.id,
				user_id: user.id,
				as_of_date: today,
				current_balance: acct.balances.current ?? 0,
				available_balance: acct.balances.available,
				source: 'plaid_initial'
			},
			{ onConflict: 'account_id,as_of_date' }
		);
	}

	await syncItem(itemRow.id);

	return json({ success: true });
};
