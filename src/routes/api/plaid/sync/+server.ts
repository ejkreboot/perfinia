import { json, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { syncItem } from '$lib/server/plaid/sync';
import { checkRateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const allowed = await checkRateLimit(`plaid_sync:${user.id}`, 12, 60 * 60);
	if (!allowed) kitError(429, 'Too many sync requests. Try again later.');

	const { data: items } = await supabaseAdmin
		.from('plaid_items')
		.select('id')
		.eq('user_id', user.id)
		.in('status', ['active', 'error']);

	const results = await Promise.allSettled((items ?? []).map((item) => syncItem(item.id)));
	const failed = results.filter((r) => r.status === 'rejected').length;

	return json({ synced: results.length - failed, failed });
};
