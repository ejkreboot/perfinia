import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const { data: flows } = await supabase
		.from('flows')
		.select('id, name, slug, direction, counts_toward_totals, sort_order')
		.eq('is_archived', false)
		.order('sort_order');

	return { flows: flows ?? [] };
};
