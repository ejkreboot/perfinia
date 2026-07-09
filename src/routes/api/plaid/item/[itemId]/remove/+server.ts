import { redirect, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { plaidClient } from '$lib/server/plaid/client';
import { decryptToken } from '$lib/server/crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const POST: RequestHandler = async ({ params, locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const { data: item } = await supabaseAdmin
		.from('plaid_items')
		.select('id, user_id, access_token_ciphertext, access_token_iv, access_token_tag')
		.eq('id', params.itemId)
		.single();

	if (!item || item.user_id !== user.id) kitError(404, 'Item not found');

	const accessToken = decryptToken({
		ciphertext: item.access_token_ciphertext,
		iv: item.access_token_iv,
		tag: item.access_token_tag
	});

	try {
		await plaidClient.itemRemove({ access_token: accessToken });
	} catch {
		// Continue even if Plaid-side removal fails (e.g. item already
		// revoked by the bank) — local cleanup should still happen.
	}

	await supabaseAdmin.from('plaid_items').delete().eq('id', item.id);

	redirect(303, '/settings');
};
