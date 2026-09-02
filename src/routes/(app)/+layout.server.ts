import type { LayoutServerLoad } from './$types';
import { hasStaleItems } from '$lib/server/plaid/autoSync';

export const load: LayoutServerLoad = async ({ locals: { supabase, user } }) => {
	const [{ data: flows }, syncStale] = await Promise.all([
		supabase
			.from('flows')
			.select('id, name, slug, direction, counts_toward_totals, sort_order')
			.eq('is_archived', false)
			.order('sort_order'),
		hasStaleItems(user!.id)
	]);

	return { flows: flows ?? [], syncStale };
};
