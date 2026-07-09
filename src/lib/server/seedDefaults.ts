import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';
import { DEFAULT_FLOWS, DEFAULT_CATEGORIES, PFC_CATEGORY_MAP } from './plaid/categorySeed';

// Seeds a new user's default flows, categories, and the Plaid PFC -> category
// mapping used to auto-categorize their first synced transactions. Idempotent:
// safe to call on every login, it's a no-op once the user already has flows.
export async function ensureUserSeeded(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<void> {
	const { count, error: countError } = await supabase
		.from('flows')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (countError) throw countError;
	if (count && count > 0) return;

	const { data: insertedFlows, error: flowsError } = await supabase
		.from('flows')
		.insert(
			DEFAULT_FLOWS.map((flow) => ({
				user_id: userId,
				name: flow.name,
				slug: flow.slug,
				direction: flow.direction,
				counts_toward_totals: flow.countsTowardTotals,
				sort_order: flow.sortOrder,
				color: flow.color
			}))
		)
		.select('id, slug');
	if (flowsError) throw flowsError;

	const flowIdBySlug = new Map(insertedFlows.map((f) => [f.slug, f.id]));

	const categoryRows = DEFAULT_CATEGORIES.map((category, index) => {
		const flowId = flowIdBySlug.get(category.flowSlug);
		if (!flowId) throw new Error(`Seed data error: no flow found for slug "${category.flowSlug}"`);
		return {
			user_id: userId,
			flow_id: flowId,
			name: category.name,
			is_supplemental_income: category.isSupplementalIncome ?? false,
			sort_order: index
		};
	});

	const { data: insertedCategories, error: categoriesError } = await supabase
		.from('categories')
		.insert(categoryRows)
		.select('id, name');
	if (categoriesError) throw categoriesError;

	const categoryIdByName = new Map(insertedCategories.map((c) => [c.name, c.id]));
	const categoryIdBySlug = new Map(
		DEFAULT_CATEGORIES.map((c) => [c.slug, categoryIdByName.get(c.name)])
	);

	const mappingRows = Object.entries(PFC_CATEGORY_MAP)
		.map(([plaidDetailedCategory, categorySlug]) => {
			const categoryId = categoryIdBySlug.get(categorySlug);
			return categoryId
				? { user_id: userId, category_id: categoryId, plaid_detailed_category: plaidDetailedCategory }
				: null;
		})
		.filter((row) => row !== null);

	const { error: mappingsError } = await supabase
		.from('category_plaid_mappings')
		.insert(mappingRows);
	if (mappingsError) throw mappingsError;
}
