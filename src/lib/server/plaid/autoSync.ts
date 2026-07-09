import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { syncItem } from './sync';

const STALE_MS = 10 * 60 * 1000;

// Called from page load functions (accounts, dashboard) as the primary sync
// trigger alongside webhooks — there's no cron in this app, so a page visit
// is what catches anything a missed/delayed webhook didn't.
export async function maybeSyncStaleItems(userId: string): Promise<void> {
	const { data: items } = await supabaseAdmin
		.from('plaid_items')
		.select('id, last_synced_at')
		.eq('user_id', userId)
		.eq('status', 'active');

	const stale = (items ?? []).filter(
		(item) =>
			!item.last_synced_at || Date.now() - new Date(item.last_synced_at).getTime() > STALE_MS
	);

	await Promise.allSettled(stale.map((item) => syncItem(item.id)));
}
