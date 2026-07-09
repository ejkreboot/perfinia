import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	const [{ data: plaidItems }, { data: profile }] = await Promise.all([
		supabaseAdmin
			.from('plaid_items')
			.select('id, institution_name, status, error_message, last_synced_at, created_at')
			.eq('user_id', user!.id)
			.order('created_at'),
		supabase.from('profiles').select('default_shift_income_estimate').eq('id', user!.id).single()
	]);

	return { plaidItems: plaidItems ?? [], profile: profile ?? { default_shift_income_estimate: null } };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const raw = String(formData.get('default_shift_income_estimate') ?? '').trim();
		const value = raw ? Number(raw) : null;

		if (raw && Number.isNaN(value)) {
			return fail(400, { error: 'Enter a valid dollar amount.' });
		}

		const { error } = await supabase
			.from('profiles')
			.update({ default_shift_income_estimate: value })
			.eq('id', user!.id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	}
};
