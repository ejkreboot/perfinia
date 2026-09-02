import type { PageServerLoad } from './$types';
import { maybeSyncStaleItems } from '$lib/server/plaid/autoSync';

export const load: PageServerLoad = async ({ locals: { supabase, user }, url }) => {
	await maybeSyncStaleItems(user!.id);

	const accountId = url.searchParams.get('account') ?? '';
	const categoryId = url.searchParams.get('category') ?? '';
	const flowId = url.searchParams.get('flow') ?? '';
	const query = url.searchParams.get('q') ?? '';
	const hidePending = url.searchParams.get('pending') === 'hide';
	const onlyUncategorized = url.searchParams.get('uncategorized') === '1';

	let categoryIdsForFlow: string[] | null = null;
	if (flowId) {
		const { data: flowCategories } = await supabase
			.from('categories')
			.select('id')
			.eq('flow_id', flowId);
		categoryIdsForFlow = (flowCategories ?? []).map((c) => c.id);
	}

	let txQuery = supabase
		.from('transactions')
		.select(
			`id, date, name, merchant_name, amount, pending, category_id, category_source, is_transfer,
			 accounts ( id, name, nickname, iso_currency_code ),
			 categories ( id, name, flow_id, flows ( id, name, color ) )`
		)
		.order('date', { ascending: false })
		.order('created_at', { ascending: false })
		.limit(200);

	if (accountId) txQuery = txQuery.eq('account_id', accountId);
	if (categoryId) txQuery = txQuery.eq('category_id', categoryId);
	if (categoryIdsForFlow) txQuery = txQuery.in('category_id', categoryIdsForFlow);
	if (query) txQuery = txQuery.ilike('name', `%${query}%`);
	if (hidePending) txQuery = txQuery.eq('pending', false);
	if (onlyUncategorized) txQuery = txQuery.eq('category_source', 'uncategorized');

	const { data: transactions, error } = await txQuery;
	if (error) throw error;

	const [{ data: accounts }, { data: categories }, { data: flows }, { count: uncategorizedCount }] =
		await Promise.all([
			supabase.from('accounts').select('id, name, nickname').eq('is_archived', false).order('name'),
			supabase
				.from('categories')
				.select('id, name, flow_id, flows ( name )')
				.eq('is_archived', false)
				.order('name'),
			supabase.from('flows').select('id, name, color').eq('is_archived', false).order('sort_order'),
			supabase
				.from('transactions')
				.select('id', { count: 'exact', head: true })
				.eq('category_source', 'uncategorized')
		]);

	return {
		transactions: transactions ?? [],
		accounts: accounts ?? [],
		categories: categories ?? [],
		flows: flows ?? [],
		uncategorizedCount: uncategorizedCount ?? 0,
		filters: { accountId, categoryId, flowId, query, hidePending, onlyUncategorized }
	};
};
