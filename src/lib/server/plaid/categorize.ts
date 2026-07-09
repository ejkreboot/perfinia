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

export async function categorizeTransaction(
	userId: string,
	tx: CategorizableTransaction
): Promise<{ categoryId: string | null; categorySource: CategorySource }> {
	const key = merchantKey(tx);

	const { data: learned } = await supabaseAdmin
		.from('merchant_category_map')
		.select('category_id')
		.eq('user_id', userId)
		.eq('merchant_key', key)
		.maybeSingle();

	if (learned) {
		return { categoryId: learned.category_id, categorySource: 'auto_merchant_learned' };
	}

	const detailedCategory = tx.personal_finance_category?.detailed;
	if (detailedCategory) {
		const { data: seeded } = await supabaseAdmin
			.from('category_plaid_mappings')
			.select('category_id')
			.eq('user_id', userId)
			.eq('plaid_detailed_category', detailedCategory)
			.maybeSingle();

		if (seeded) {
			return { categoryId: seeded.category_id, categorySource: 'auto_seed' };
		}
	}

	return { categoryId: null, categorySource: 'uncategorized' };
}
