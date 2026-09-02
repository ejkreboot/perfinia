import { plaidClient } from './client';
import { decryptToken } from '$lib/server/crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

// Deleting a plaid_items row cascades to accounts, and an accounts row
// cascades to transactions and balance_snapshots (see 0001_init.sql), so
// removal is a single delete in each case rather than a manual teardown.

// Releases the item at Plaid, then deletes it locally. Plaid-side failure is
// non-fatal: if the token is already revoked by the bank, refusing to clean up
// locally would leave the user stuck with a row they can't get rid of.
export async function removePlaidItem(itemId: string): Promise<{ plaidReleased: boolean }> {
	const { data: item } = await supabaseAdmin
		.from('plaid_items')
		.select('id, access_token_ciphertext, access_token_iv, access_token_tag')
		.eq('id', itemId)
		.single();

	if (!item) return { plaidReleased: false };

	let plaidReleased = false;
	try {
		await plaidClient.itemRemove({
			access_token: decryptToken({
				ciphertext: item.access_token_ciphertext,
				iv: item.access_token_iv,
				tag: item.access_token_tag
			})
		});
		plaidReleased = true;
	} catch (err) {
		console.error('[plaid] itemRemove failed for item %s:', itemId, err);
	}

	await supabaseAdmin.from('plaid_items').delete().eq('id', item.id);

	return { plaidReleased };
}

export type RemoveAccountResult = {
	removedItem: boolean;
	plaidReleased: boolean;
};

// Hard-deletes one account and everything hanging off it. If it was the last
// account on its Plaid item, the item goes too — otherwise we'd keep syncing a
// live access token for an institution the user has nothing left from.
export async function removeAccount(
	userId: string,
	accountId: string
): Promise<RemoveAccountResult> {
	const { data: account } = await supabaseAdmin
		.from('accounts')
		.select('id, user_id, plaid_item_id')
		.eq('id', accountId)
		.maybeSingle();

	if (!account || account.user_id !== userId) {
		throw new Error('Account not found');
	}

	const { error } = await supabaseAdmin.from('accounts').delete().eq('id', account.id);
	if (error) throw new Error(error.message);

	if (!account.plaid_item_id) {
		return { removedItem: false, plaidReleased: false };
	}

	const { count } = await supabaseAdmin
		.from('accounts')
		.select('id', { count: 'exact', head: true })
		.eq('plaid_item_id', account.plaid_item_id);

	if ((count ?? 0) > 0) {
		return { removedItem: false, plaidReleased: false };
	}

	const { plaidReleased } = await removePlaidItem(account.plaid_item_id);
	return { removedItem: true, plaidReleased };
}

// Re-linking an institution issues a new Plaid item_id, so exchange-token
// creates a second plaid_items row while the previous one lingers with a live
// access token that maybeSyncStaleItems keeps syncing. Called after the new
// item's accounts are upserted, to release the ones it supersedes.
export async function releaseSupersededItems(
	userId: string,
	keepItemId: string,
	institutionId: string | null
): Promise<number> {
	if (!institutionId) return 0;

	const { data: superseded } = await supabaseAdmin
		.from('plaid_items')
		.select('id')
		.eq('user_id', userId)
		.eq('institution_id', institutionId)
		.neq('id', keepItemId);

	for (const item of superseded ?? []) {
		// Deleting an item cascades to its accounts and their transactions, so
		// anything still pointing at the old row moves to the new one first.
		// An account the user deselected during re-link keeps its history here
		// rather than being silently destroyed; it simply stops updating.
		await supabaseAdmin
			.from('accounts')
			.update({ plaid_item_id: keepItemId })
			.eq('plaid_item_id', item.id);

		await removePlaidItem(item.id);
	}

	return superseded?.length ?? 0;
}
