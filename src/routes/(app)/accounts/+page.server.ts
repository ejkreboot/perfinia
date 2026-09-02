import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { removeAccount } from '$lib/server/plaid/remove';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: accounts, error } = await supabase
		.from('accounts')
		.select(
			'id, name, nickname, mask, official_name, type, subtype, is_manual, is_asset, current_balance, iso_currency_code, updated_at, transactions(count)'
		)
		.eq('is_archived', false)
		.order('created_at');

	if (error) throw error;

	return {
		accounts: (accounts ?? []).map(({ transactions, ...account }) => ({
			...account,
			transactionCount: transactions?.[0]?.count ?? 0
		}))
	};
};

export const actions: Actions = {
	// A blank nickname clears it, falling back to the institution's own name.
	rename: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const nickname = String(formData.get('nickname') ?? '').trim();
		if (!id) return fail(400, { error: 'Missing account id' });

		const { error } = await supabase
			.from('accounts')
			.update({ nickname: nickname || null })
			.eq('id', id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	archive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabase
			.from('accounts')
			.update({ is_archived: true, archived_at: new Date().toISOString() })
			.eq('id', id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	// Irreversible: deletes the account plus its transactions and balance
	// snapshots via cascade. Re-linking the institution brings the account back
	// as a fresh row with a fresh backfill.
	remove: async ({ request, locals: { user } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing account id' });

		try {
			const { removedItem } = await removeAccount(user!.id, id);
			return { success: true, removedItem };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to remove account' });
		}
	}
};
