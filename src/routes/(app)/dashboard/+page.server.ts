import type { PageServerLoad } from './$types';
import { computeNetWorthSeries } from '$lib/netWorthSeries';
import { detectRecurringMerchants } from '$lib/server/recurring';

function startOfMonth(): string {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function monthsAgo(n: number): string {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() - n, now.getDate()).toISOString().slice(0, 10);
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [{ data: accounts }, { data: flows }] = await Promise.all([
		supabase.from('accounts').select('id, is_asset, current_balance').eq('is_archived', false),
		supabase
			.from('flows')
			.select('id, name, slug, direction, counts_toward_totals, monthly_target, color, sort_order')
			.eq('is_archived', false)
			.order('sort_order')
	]);

	const accountList = accounts ?? [];
	const netWorth = accountList.reduce(
		(sum, a) => sum + (a.is_asset ? (a.current_balance ?? 0) : -(a.current_balance ?? 0)),
		0
	);

	const { data: snapshots } = await supabase
		.from('balance_snapshots')
		.select('account_id, as_of_date, current_balance')
		.in(
			'account_id',
			accountList.map((a) => a.id)
		)
		.order('as_of_date');

	const isAssetByAccount = new Map(accountList.map((a) => [a.id, a.is_asset]));
	const netWorthSeries = computeNetWorthSeries(snapshots ?? [], isAssetByAccount);

	const monthStart = startOfMonth();
	const { data: monthTransactions } = await supabase
		.from('transactions')
		.select(
			`amount, category_id,
			 categories ( is_supplemental_income, flows ( id, slug, direction, counts_toward_totals ) )`
		)
		.gte('date', monthStart);

	let incomeTotal = 0;
	let baseIncomeTotal = 0;
	let outflowTotal = 0;
	const flowTotals = new Map<string, number>();

	for (const tx of monthTransactions ?? []) {
		const flow = tx.categories?.flows;
		if (!flow || !flow.counts_toward_totals) continue;

		if (flow.direction === 'inflow') {
			const amount = -tx.amount;
			incomeTotal += amount;
			if (!tx.categories?.is_supplemental_income) baseIncomeTotal += amount;
		} else {
			outflowTotal += tx.amount;
			flowTotals.set(flow.id, (flowTotals.get(flow.id) ?? 0) + tx.amount);
		}
	}

	const flowAllocation = (flows ?? [])
		.filter((f) => f.direction === 'outflow' && f.counts_toward_totals)
		.map((f) => ({
			id: f.id,
			name: f.name,
			slug: f.slug,
			color: f.color,
			amount: flowTotals.get(f.id) ?? 0
		}))
		.filter((f) => f.amount > 0);

	const savingsRate =
		incomeTotal > 0 ? (flows ?? []).find((f) => f.slug === 'savings_investing') : null;
	const savingsAmount = savingsRate ? (flowTotals.get(savingsRate.id) ?? 0) : 0;
	const savingsRatePct = incomeTotal > 0 ? savingsAmount / incomeTotal : null;

	const essentialFlow = (flows ?? []).find((f) => f.slug === 'fixed_essential');
	const savingsFlow = (flows ?? []).find((f) => f.slug === 'savings_investing');
	const debtFlow = (flows ?? []).find((f) => f.slug === 'debt_paydown');

	const essentialTarget =
		essentialFlow?.monthly_target ?? flowTotals.get(essentialFlow?.id ?? '') ?? 0;
	const savingsTarget = savingsFlow?.monthly_target ?? 0;
	const debtTarget = debtFlow?.monthly_target ?? 0;
	const totalCommitted = essentialTarget + savingsTarget + debtTarget;
	const shortfall = totalCommitted - baseIncomeTotal;

	const { data: recentTransactions } = await supabase
		.from('transactions')
		.select(
			`id, date, name, merchant_name, amount, pending,
			 accounts ( name, iso_currency_code ),
			 categories ( name, flows ( color, slug ) )`
		)
		.order('date', { ascending: false })
		.order('created_at', { ascending: false })
		.limit(8);

	const { count: uncategorizedCount } = await supabase
		.from('transactions')
		.select('id', { count: 'exact', head: true })
		.eq('category_source', 'uncategorized');

	const { data: recurringCandidates } = await supabase
		.from('transactions')
		.select('name, merchant_name, merchant_entity_id, date, amount')
		.eq('is_transfer', false)
		.gt('amount', 0)
		.gte('date', monthsAgo(12));

	const recurring = detectRecurringMerchants(recurringCandidates ?? []).slice(0, 6);

	return {
		netWorth,
		netWorthSeries,
		incomeTotal,
		outflowTotal,
		savingsRatePct,
		flowAllocation,
		insight: {
			baseIncomeTotal,
			totalCommitted,
			shortfall
		},
		recentTransactions: recentTransactions ?? [],
		uncategorizedCount: uncategorizedCount ?? 0,
		recurring
	};
};
