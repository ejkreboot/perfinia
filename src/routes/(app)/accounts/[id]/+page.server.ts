import { error as kitError, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: account, error } = await supabase
		.from('accounts')
		.select(
			'id, name, nickname, mask, official_name, type, subtype, is_manual, is_asset, current_balance, iso_currency_code, is_archived'
		)
		.eq('id', params.id)
		.single();

	if (error || !account) kitError(404, 'Account not found');

	const { data: snapshots } = await supabase
		.from('balance_snapshots')
		.select('id, as_of_date, current_balance, source')
		.eq('account_id', params.id)
		.order('as_of_date', { ascending: false })
		.limit(24);

	return { account, snapshots: snapshots ?? [] };
};

export const actions: Actions = {
	// A blank nickname clears it, falling back to the institution's own name.
	rename: async ({ request, params, locals: { supabase } }) => {
		const formData = await request.formData();
		const nickname = String(formData.get('nickname') ?? '').trim();

		const { error } = await supabase
			.from('accounts')
			.update({ nickname: nickname || null })
			.eq('id', params.id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	updateBalance: async ({ request, params, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const balance = Number(formData.get('balance'));
		const asOfDate = String(formData.get('as_of_date') ?? '').trim();

		if (Number.isNaN(balance) || !asOfDate) {
			return fail(400, { error: 'Enter a valid balance and date.' });
		}

		const { error: snapshotError } = await supabase.from('balance_snapshots').upsert(
			{
				account_id: params.id,
				user_id: user!.id,
				as_of_date: asOfDate,
				current_balance: balance,
				source: 'manual_entry'
			},
			{ onConflict: 'account_id,as_of_date' }
		);
		if (snapshotError) return fail(400, { error: snapshotError.message });

		const { data: latest } = await supabase
			.from('balance_snapshots')
			.select('as_of_date')
			.eq('account_id', params.id)
			.order('as_of_date', { ascending: false })
			.limit(1)
			.single();

		if (latest?.as_of_date === asOfDate) {
			const { error: accountUpdateError } = await supabase
				.from('accounts')
				.update({ current_balance: balance })
				.eq('id', params.id);
			if (accountUpdateError) return fail(400, { error: accountUpdateError.message });
		}

		return { success: true };
	},

	archive: async ({ params, locals: { supabase } }) => {
		await supabase
			.from('accounts')
			.update({ is_archived: true, archived_at: new Date().toISOString() })
			.eq('id', params.id);
		redirect(303, '/accounts');
	},

	unarchive: async ({ params, locals: { supabase } }) => {
		await supabase
			.from('accounts')
			.update({ is_archived: false, archived_at: null })
			.eq('id', params.id);
		return { success: true };
	},

	delete: async ({ params, locals: { supabase } }) => {
		const { error: deleteError } = await supabase.from('accounts').delete().eq('id', params.id);
		if (deleteError) return fail(400, { error: deleteError.message });
		redirect(303, '/accounts');
	}
};
