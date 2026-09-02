import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	const { data: plaidItems } = await supabaseAdmin
		.from('plaid_items')
		.select('id, institution_name, status, error_message, last_synced_at, created_at')
		.eq('user_id', user!.id)
		.order('created_at');

	return { plaidItems: plaidItems ?? [] };
};

