<script lang="ts">
	import { flowChartColor } from '$lib/flowColors';
	import { formatCurrency, formatDate } from '$lib/format';
	import NetWorthChart from '$lib/components/NetWorthChart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let totalAllocated = $derived(data.flowAllocation.reduce((sum, f) => sum + f.amount, 0));

	let onTrack = $derived(data.insight.shortfall <= 0);
</script>

<svelte:head>
	<title>Dashboard — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-8 py-10">
	<h1 class="font-display text-2xl font-semibold">Dashboard</h1>

	{#if data.uncategorizedCount > 0}
		<a
			href="/transactions?uncategorized=1"
			class="mt-4 block rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay hover:bg-clay/15"
		>
			{data.uncategorizedCount} transaction{data.uncategorizedCount === 1 ? '' : 's'} need{data.uncategorizedCount === 1 ? 's' : ''}
			a category &rarr;
		</a>
	{/if}

	<div class="mt-6 grid grid-cols-4 gap-4">
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-xs font-medium tracking-wide text-ink/50 uppercase">Net Worth</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-ink">
				{formatCurrency(data.netWorth)}
			</p>
		</div>
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-xs font-medium tracking-wide text-ink/50 uppercase">Income (MTD)</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-sage">
				{formatCurrency(data.incomeTotal)}
			</p>
		</div>
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-xs font-medium tracking-wide text-ink/50 uppercase">Flow-Out (MTD)</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-ink">
				{formatCurrency(data.outflowTotal)}
			</p>
		</div>
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-xs font-medium tracking-wide text-ink/50 uppercase">Savings Rate</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-channel">
				{data.savingsRatePct !== null ? `${Math.round(data.savingsRatePct * 100)}%` : '—'}
			</p>
		</div>
	</div>

	<div class="mt-8 rounded-xl border border-ink/10 bg-white p-6">
		<h2 class="text-sm font-semibold text-ink">Net worth over time</h2>
		<div class="mt-4">
			<NetWorthChart points={data.netWorthSeries} />
		</div>
	</div>

	<div class="mt-8 grid grid-cols-3 gap-6">
		<div class="col-span-2 rounded-xl border border-ink/10 bg-white p-6">
			<h2 class="text-sm font-semibold text-ink">This month's flow allocation</h2>
			<p class="mt-1 text-xs text-ink/50">
				Where the balance of spending went — the lens that matters more than any single
				category budget.
			</p>

			{#if data.flowAllocation.length === 0}
				<p class="mt-6 text-sm text-ink/40">No outflow transactions yet this month.</p>
			{:else}
				<div class="mt-5 flex h-6 gap-0.5 overflow-hidden rounded-md">
					{#each data.flowAllocation as flow (flow.id)}
						<div
							style="width: {(flow.amount / totalAllocated) * 100}%; background-color: {flowChartColor(
								flow
							)}"
							title="{flow.name}: {formatCurrency(flow.amount)}"
						></div>
					{/each}
				</div>

				<ul class="mt-4 space-y-2">
					{#each data.flowAllocation as flow (flow.id)}
						<li class="flex items-center gap-3 text-sm">
							<span
								class="h-2.5 w-2.5 shrink-0 rounded-full"
								style="background-color: {flowChartColor(flow)}"
							></span>
							<span class="flex-1 text-ink">{flow.name}</span>
							<span class="text-ink/50">{Math.round((flow.amount / totalAllocated) * 100)}%</span>
							<span class="font-mono-nums w-24 text-right font-medium text-ink"
								>{formatCurrency(flow.amount)}</span
							>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div
			class="rounded-xl border p-6 {onTrack
				? 'border-sage/30 bg-sage/5'
				: 'border-clay/30 bg-clay/5'}"
		>
			<h2 class="text-sm font-semibold text-ink">Are we on track?</h2>
			{#if onTrack}
				<p class="mt-3 text-sm text-ink/70">
					Base income covers your essential, savings, and debt commitments this month.
				</p>
			{:else if data.insight.hasShiftEstimate}
				<p class="mt-3 text-sm text-ink/70">
					You're short {formatCurrency(data.insight.shortfall)} against this month's committed
					spend.
				</p>
				<p class="mt-2 text-lg font-semibold text-clay">
					~{data.insight.shiftsNeeded} extra shift{data.insight.shiftsNeeded === 1 ? '' : 's'}
				</p>
				<p class="mt-1 text-xs text-ink/50">would close the gap.</p>
			{:else}
				<p class="mt-3 text-sm text-ink/70">
					You're short {formatCurrency(data.insight.shortfall)} against this month's committed
					spend.
				</p>
				<a href="/settings" class="mt-2 inline-block text-xs text-channel underline"
					>Set a per-shift estimate to see how many shifts would close the gap.</a
				>
			{/if}
		</div>
	</div>

	<div class="mt-8 rounded-xl border border-ink/10 bg-white p-6">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-ink">Recent transactions</h2>
			<a href="/transactions" class="text-xs text-channel hover:underline">View all &rarr;</a>
		</div>
		{#if data.recentTransactions.length === 0}
			<p class="text-sm text-ink/40">No transactions yet.</p>
		{:else}
			<ul class="divide-y divide-ink/5">
				{#each data.recentTransactions as tx (tx.id)}
					<li class="flex items-center gap-3 py-2.5 text-sm">
						<span
							class="h-2 w-2 shrink-0 rounded-full"
							style="background-color: {tx.categories?.flows
								? flowChartColor(tx.categories.flows)
								: 'var(--color-mist)'}"
						></span>
						<span class="w-20 shrink-0 text-ink/50">{formatDate(tx.date)}</span>
						<span class="flex-1 truncate text-ink">{tx.merchant_name ?? tx.name}</span>
						<span class="text-xs text-ink/40">{tx.categories?.name ?? 'Uncategorized'}</span>
						<span class="font-mono-nums w-24 text-right font-medium text-ink"
							>{formatCurrency(Math.abs(tx.amount), tx.accounts?.iso_currency_code ?? 'USD')}</span
						>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if data.recurring.length > 0}
		<div class="mt-8 rounded-xl border border-ink/10 bg-white p-6">
			<h2 class="text-sm font-semibold text-ink">Recurring & subscriptions</h2>
			<p class="mt-1 text-xs text-ink/50">
				Detected from repeating merchant, amount, and timing — not something you set up.
			</p>
			<ul class="mt-4 divide-y divide-ink/5">
				{#each data.recurring as item (item.key)}
					<li class="flex items-center gap-3 py-2.5 text-sm">
						<span class="flex-1 truncate text-ink">{item.label}</span>
						<span class="text-xs text-ink/40">{item.cadence}</span>
						<span class="font-mono-nums w-24 text-right text-ink/60"
							>{formatCurrency(item.averageAmount)}</span
						>
						<span class="font-mono-nums w-28 text-right font-medium text-ink"
							>{formatCurrency(item.monthlyEquivalent)}/mo</span
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
