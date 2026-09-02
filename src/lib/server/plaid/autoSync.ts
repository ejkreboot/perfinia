import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { syncItem } from './sync';

const STALE_MS = 10 * 60 * 1000;

// Guards against the reload stampede: a page load kicks off a sync, and
// without this every refresh while it runs launches another sync of the same
// item, racing on the cursor. In-process only, which is enough for the single
// app instance this runs on — a duplicate across instances is wasteful but
// safe, since transactions upsert on plaid_transaction_id.
const inFlight = new Set<string>();

async function staleItemIds(userId: string): Promise<string[]> {
	const { data: items } = await supabaseAdmin
		.from('plaid_items')
		.select('id, last_synced_at')
		.eq('user_id', userId)
		.eq('status', 'active');

	return (items ?? [])
		.filter(
			(item) =>
				!item.last_synced_at || Date.now() - new Date(item.last_synced_at).getTime() > STALE_MS
		)
		.map((item) => item.id);
}

// Cheap read used by the (app) layout load to decide whether the client should
// kick off a sync. Never touches Plaid, so it stays off the render critical path.
export async function hasStaleItems(userId: string): Promise<boolean> {
	return (await staleItemIds(userId)).length > 0;
}

// Called from POST /api/plaid/sync-stale after the page has rendered — there's
// no cron in this app, so a page visit is what catches anything a missed or
// delayed webhook didn't.
export async function maybeSyncStaleItems(
	userId: string
): Promise<{ synced: number; failed: number }> {
	const stale = (await staleItemIds(userId)).filter((id) => !inFlight.has(id));
	if (stale.length === 0) return { synced: 0, failed: 0 };

	for (const id of stale) inFlight.add(id);
	try {
		const results = await Promise.allSettled(stale.map((id) => syncItem(id)));
		const failed = results.filter((r) => r.status === 'rejected').length;
		return { synced: results.length - failed, failed };
	} finally {
		for (const id of stale) inFlight.delete(id);
	}
}
