import type { Transaction } from 'plaid';
import { plaidClient } from './client';
import { decryptToken } from '$lib/server/crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { categorizeTransaction } from './categorize';

const LIABILITY_TYPES = new Set(['credit', 'loan']);

// Cursor-based /transactions/sync loop shared by the initial backfill
// (exchange-token), the webhook handler, and any on-demand "sync now" call.
// The cursor is persisted after every page so a mid-loop failure resumes
// cleanly on the next call instead of reprocessing from scratch.
export async function syncItem(itemRowId: string): Promise<void> {
	const { data: item, error: itemError } = await supabaseAdmin
		.from('plaid_items')
		.select('id, user_id, access_token_ciphertext, access_token_iv, access_token_tag, cursor')
		.eq('id', itemRowId)
		.single();

	if (itemError || !item) throw new Error(itemError?.message ?? 'Plaid item not found');

	const accessToken = decryptToken({
		ciphertext: item.access_token_ciphertext,
		iv: item.access_token_iv,
		tag: item.access_token_tag
	});

	try {
		let cursor = item.cursor ?? undefined;
		let hasMore = true;

		while (hasMore) {
			const response = await plaidClient.transactionsSync({
				access_token: accessToken,
				cursor,
				count: 500
			});
			const { added, modified, removed, next_cursor, has_more } = response.data;

			for (const tx of [...added, ...modified]) {
				await upsertTransaction(item.user_id, tx);
			}

			for (const tx of removed) {
				if (!tx.transaction_id) continue;
				await supabaseAdmin
					.from('transactions')
					.delete()
					.eq('plaid_transaction_id', tx.transaction_id);
			}

			cursor = next_cursor;
			hasMore = has_more;

			await supabaseAdmin.from('plaid_items').update({ cursor }).eq('id', itemRowId);
		}

		await refreshBalances(item.user_id, accessToken);

		await supabaseAdmin
			.from('plaid_items')
			.update({
				status: 'active',
				error_code: null,
				error_message: null,
				last_synced_at: new Date().toISOString()
			})
			.eq('id', itemRowId);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown sync error';
		await supabaseAdmin
			.from('plaid_items')
			.update({ status: 'error', error_message: message })
			.eq('id', itemRowId);
		throw err;
	}
}

async function refreshBalances(userId: string, accessToken: string): Promise<void> {
	const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
	const today = new Date().toISOString().slice(0, 10);

	for (const acct of accountsResponse.data.accounts) {
		const { data: accountRow } = await supabaseAdmin
			.from('accounts')
			.update({
				current_balance: acct.balances.current,
				available_balance: acct.balances.available,
				credit_limit: acct.balances.limit
			})
			.eq('plaid_account_id', acct.account_id)
			.select('id')
			.single();

		if (!accountRow) continue;

		await supabaseAdmin.from('balance_snapshots').upsert(
			{
				account_id: accountRow.id,
				user_id: userId,
				as_of_date: today,
				current_balance: acct.balances.current ?? 0,
				available_balance: acct.balances.available,
				source: 'plaid_sync'
			},
			{ onConflict: 'account_id,as_of_date' }
		);
	}
}

async function upsertTransaction(userId: string, tx: Transaction): Promise<void> {
	const { data: accountRow } = await supabaseAdmin
		.from('accounts')
		.select('id')
		.eq('plaid_account_id', tx.account_id)
		.single();

	if (!accountRow) return;

	// Never clobber a user's manual recategorization on a later sync.
	const { data: existing } = await supabaseAdmin
		.from('transactions')
		.select('category_source')
		.eq('plaid_transaction_id', tx.transaction_id)
		.maybeSingle();

	const preserveManualCategory = existing?.category_source === 'user_manual';

	const categoryFields = preserveManualCategory
		? {}
		: await categorizeTransaction(userId, tx).then(({ categoryId, categorySource }) => ({
				category_id: categoryId,
				category_source: categorySource
			}));

	const primaryCategory = tx.personal_finance_category?.primary ?? null;

	await supabaseAdmin.from('transactions').upsert(
		{
			user_id: userId,
			account_id: accountRow.id,
			plaid_transaction_id: tx.transaction_id,
			plaid_pending_transaction_id: tx.pending_transaction_id,
			pending: tx.pending,
			amount: tx.amount,
			iso_currency_code: tx.iso_currency_code ?? 'USD',
			date: tx.date,
			authorized_date: tx.authorized_date,
			name: tx.name,
			merchant_name: tx.merchant_name,
			merchant_entity_id: tx.merchant_entity_id,
			plaid_category_primary: primaryCategory,
			plaid_category_detailed: tx.personal_finance_category?.detailed ?? null,
			plaid_raw: tx,
			is_transfer: primaryCategory === 'TRANSFER_IN' || primaryCategory === 'TRANSFER_OUT',
			...categoryFields
		},
		{ onConflict: 'plaid_transaction_id' }
	);
}

export function isAssetAccountType(type: string): boolean {
	return !LIABILITY_TYPES.has(type);
}
