import { json, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { maybeSyncStaleItems } from '$lib/server/plaid/autoSync';
import { checkRateLimit } from '$lib/server/rateLimit';

// Triggered by the client once per page load when the layout reports a stale
// item, replacing the blocking maybeSyncStaleItems() call that used to sit in
// the dashboard and accounts loaders.
export const POST: RequestHandler = async ({ locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const allowed = await checkRateLimit(`plaid_sync_stale:${user.id}`, 30, 60 * 60);
	if (!allowed) kitError(429, 'Too many sync requests. Try again later.');

	return json(await maybeSyncStaleItems(user.id));
};
