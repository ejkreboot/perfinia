import type { Transaction } from 'plaid';
import { plaidClient } from './client';
import { decryptToken } from '$lib/server/crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { categorizeTransaction, loadCategoryLookup, type CategoryLookup } from './categorize';
import type { Json } from '$lib/database.types';

const LIABILITY_TYPES = new Set(['credit', 'loan']);

// PostgREST puts `in.(...)` filters in the query string, so batched reads are
// chunked to keep the URL well under proxy limits.
const FILTER_CHUNK = 200;
const WRITE_CHUNK = 500;

function chunk<T>(items: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
	return out;
}

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
		// Loaded once per sync rather than per transaction — these were the
		// bulk of the per-row round trips that made a backfill take minutes.
		const [accountsByPlaidId, lookup] = await Promise.all([
			loadAccountMap(item.user_id),
			loadCategoryLookup(item.user_id)
		]);

		let cursor = item.cursor ?? undefined;
		let hasMore = true;

		while (hasMore) {
			const response = await plaidClient.transactionsSync({
				access_token: accessToken,
				cursor,
				count: 500
			});
			const { added, modified, removed, next_cursor, has_more } = response.data;

			await upsertTransactions(item.user_id, [...added, ...modified], accountsByPlaidId, lookup);

			const removedIds = removed.map((tx) => tx.transaction_id).filter((id): id is string => !!id);
			for (const ids of chunk(removedIds, FILTER_CHUNK)) {
				await supabaseAdmin.from('transactions').delete().in('plaid_transaction_id', ids);
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

async function loadAccountMap(userId: string): Promise<Map<string, string>> {
	const { data } = await supabaseAdmin
		.from('accounts')
		.select('id, plaid_account_id')
		.eq('user_id', userId);

	return new Map(
		(data ?? [])
			.filter((a): a is typeof a & { plaid_account_id: string } => !!a.plaid_account_id)
			.map((a) => [a.plaid_account_id, a.id])
	);
}

async function upsertTransactions(
	userId: string,
	transactions: Transaction[],
	accountsByPlaidId: Map<string, string>,
	lookup: CategoryLookup
): Promise<void> {
	const known = transactions.filter((tx) => accountsByPlaidId.has(tx.account_id));
	if (known.length === 0) return;

	// Never clobber a user's manual recategorization on a later sync: one read
	// for the whole page instead of one per transaction.
	const manual = new Set<string>();
	for (const ids of chunk(
		known.map((tx) => tx.transaction_id),
		FILTER_CHUNK
	)) {
		const { data } = await supabaseAdmin
			.from('transactions')
			.select('plaid_transaction_id')
			.in('plaid_transaction_id', ids)
			.eq('category_source', 'user_manual');

		for (const row of data ?? []) {
			if (row.plaid_transaction_id) manual.add(row.plaid_transaction_id);
		}
	}

	const rows = known.map((tx) => {
		const primaryCategory = tx.personal_finance_category?.primary ?? null;
		const categoryFields = manual.has(tx.transaction_id)
			? {}
			: (({ categoryId, categorySource }) => ({
					category_id: categoryId,
					category_source: categorySource
				}))(categorizeTransaction(lookup, tx));

		return {
			user_id: userId,
			account_id: accountsByPlaidId.get(tx.account_id)!,
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
			plaid_raw: tx as unknown as Json,
			is_transfer: primaryCategory === 'TRANSFER_IN' || primaryCategory === 'TRANSFER_OUT',
			...categoryFields
		};
	});

	for (const batch of chunk(rows, WRITE_CHUNK)) {
		const { error } = await supabaseAdmin
			.from('transactions')
			.upsert(batch, { onConflict: 'plaid_transaction_id' });
		if (error) throw new Error(error.message);
	}
}

async function refreshBalances(userId: string, accessToken: string): Promise<void> {
	const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
	const today = new Date().toISOString().slice(0, 10);

	const updated = await Promise.all(
		accountsResponse.data.accounts.map(async (acct) => {
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

			return accountRow ? { acct, accountId: accountRow.id } : null;
		})
	);

	const snapshots = updated
		.filter((r): r is NonNullable<typeof r> => r !== null)
		.map(({ acct, accountId }) => ({
			account_id: accountId,
			user_id: userId,
			as_of_date: today,
			current_balance: acct.balances.current ?? 0,
			available_balance: acct.balances.available,
			source: 'plaid_sync'
		}));

	if (snapshots.length > 0) {
		await supabaseAdmin
			.from('balance_snapshots')
			.upsert(snapshots, { onConflict: 'account_id,as_of_date' });
	}
}

export function isAssetAccountType(type: string): boolean {
	return !LIABILITY_TYPES.has(type);
}
