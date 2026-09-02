import { supabaseAdmin } from '$lib/server/supabaseAdmin';

type CategorizableTransaction = {
	merchant_entity_id?: string | null;
	merchant_name?: string | null;
	name: string;
	personal_finance_category?: { detailed?: string | null } | null;
};

// Prefer Plaid's stable merchant_entity_id; fall back to a normalized name
// (uppercased, digits/punctuation stripped) so store-number suffixes like
// "TARGET 00123" and "TARGET 00456" collapse to the same key.
export function merchantKey(tx: CategorizableTransaction): string {
	if (tx.merchant_entity_id) return `entity:${tx.merchant_entity_id}`;

	const raw = tx.merchant_name || tx.name;
	const normalized = raw
		.toUpperCase()
		.replace(/[0-9]+/g, '')
		.replace(/[^A-Z ]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	return `name:${normalized}`;
}

export type CategorySource = 'auto_merchant_learned' | 'auto_seed' | 'uncategorized';

// Both mapping tables are per-user and small (merchant_category_map is bounded
// by distinct merchants, category_plaid_mappings by Plaid's ~120 detailed
// categories), so a sync loads them once and categorizes in memory rather than
// issuing two queries per transaction.
export type CategoryLookup = {
	learned: Map<string, string>;
	seeded: Map<string, string>;
};

export async function loadCategoryLookup(userId: string): Promise<CategoryLookup> {
	const [{ data: learnedRows }, { data: seededRows }] = await Promise.all([
		supabaseAdmin
			.from('merchant_category_map')
			.select('merchant_key, category_id')
			.eq('user_id', userId),
		supabaseAdmin
			.from('category_plaid_mappings')
			.select('plaid_detailed_category, category_id')
			.eq('user_id', userId)
	]);

	return {
		learned: new Map((learnedRows ?? []).map((r) => [r.merchant_key, r.category_id])),
		seeded: new Map((seededRows ?? []).map((r) => [r.plaid_detailed_category, r.category_id]))
	};
}

export function categorizeTransaction(
	lookup: CategoryLookup,
	tx: CategorizableTransaction
): { categoryId: string | null; categorySource: CategorySource } {
	const learned = lookup.learned.get(merchantKey(tx));
	if (learned) {
		return { categoryId: learned, categorySource: 'auto_merchant_learned' };
	}

	const detailedCategory = tx.personal_finance_category?.detailed;
	if (detailedCategory) {
		const seeded = lookup.seeded.get(detailedCategory);
		if (seeded) {
			return { categoryId: seeded, categorySource: 'auto_seed' };
		}
	}

	return { categoryId: null, categorySource: 'uncategorized' };
}
