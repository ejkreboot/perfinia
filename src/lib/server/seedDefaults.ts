import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_FLOWS, DEFAULT_CATEGORIES, PFC_CATEGORY_MAP } from './plaid/categorySeed';

// Seeds a new user's default flows, categories, and the Plaid PFC -> category
// mapping used to auto-categorize their first synced transactions. Idempotent:
// safe to call on every login, it's a no-op once the user already has flows.
export async function ensureUserSeeded(supabase: SupabaseClient, userId: string): Promise<void> {
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
				sort_order: flow.sortOrder
			}))
		)
		.select('id, slug');
	if (flowsError) throw flowsError;

	const flowIdBySlug = new Map(insertedFlows.map((f) => [f.slug, f.id]));

	const { data: insertedCategories, error: categoriesError } = await supabase
		.from('categories')
		.insert(
			DEFAULT_CATEGORIES.map((category, index) => ({
				user_id: userId,
				flow_id: flowIdBySlug.get(category.flowSlug),
				name: category.name,
				is_supplemental_income: category.isSupplementalIncome ?? false,
				sort_order: index
			}))
		)
		.select('id, name');
	if (categoriesError) throw categoriesError;

	const categoryIdByName = new Map(insertedCategories.map((c) => [c.name, c.id]));
	const categoryIdBySlug = new Map(
		DEFAULT_CATEGORIES.map((c) => [c.slug, categoryIdByName.get(c.name)])
	);

	const mappingRows = Object.entries(PFC_CATEGORY_MAP)
		.map(([plaidDetailedCategory, categorySlug]) => ({
			user_id: userId,
			category_id: categoryIdBySlug.get(categorySlug),
			plaid_detailed_category: plaidDetailedCategory
		}))
		.filter((row) => row.category_id);

	const { error: mappingsError } = await supabase
		.from('category_plaid_mappings')
		.insert(mappingRows);
	if (mappingsError) throw mappingsError;
}
