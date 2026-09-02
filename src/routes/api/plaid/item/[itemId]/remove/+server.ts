import { redirect, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { removePlaidItem } from '$lib/server/plaid/remove';

export const POST: RequestHandler = async ({ params, locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const { data: item } = await supabaseAdmin
		.from('plaid_items')
		.select('id, user_id')
		.eq('id', params.itemId)
		.maybeSingle();

	if (!item || item.user_id !== user.id) kitError(404, 'Item not found');

	await removePlaidItem(item.id);

	redirect(303, '/settings');
};
