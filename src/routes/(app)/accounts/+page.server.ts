import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: accounts, error } = await supabase
		.from('accounts')
		.select(
			'id, name, official_name, type, subtype, is_manual, is_asset, current_balance, iso_currency_code, updated_at'
		)
		.eq('is_archived', false)
		.order('created_at');

	if (error) throw error;

	return { accounts: accounts ?? [] };
};

export const actions: Actions = {
	archive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabase
			.from('accounts')
			.update({ is_archived: true, archived_at: new Date().toISOString() })
			.eq('id', id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	}
};
