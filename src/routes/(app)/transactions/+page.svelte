<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatCurrency, formatDate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let toast = $state<string | null>(null);
	let updatingId = $state<string | null>(null);

	let groupedCategories = $derived.by(() => {
		const byFlow = new Map<string, { flowName: string; categories: typeof data.categories }>();
		for (const category of data.categories) {
			const flowName = category.flows?.name ?? 'Other';
			const entry = byFlow.get(flowName) ?? { flowName, categories: [] };
			entry.categories.push(category);
			byFlow.set(flowName, entry);
		}
		return [...byFlow.values()];
	});

	async function updateCategory(txId: string, categoryId: string) {
		updatingId = txId;
		toast = null;
		try {
			const response = await fetch(`/api/transactions/${txId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category_id: categoryId, applyToMerchant: true })
			});
			if (response.ok) {
				const { updatedCount } = await response.json();
				toast =
					updatedCount > 0
						? `Updated this transaction and ${updatedCount} other${updatedCount === 1 ? '' : 's'} from the same merchant.`
						: 'Updated.';
				await invalidateAll();
			} else {
				toast = 'Could not update category.';
			}
		} finally {
			updatingId = null;
		}
	}

	function signClass(amount: number): string {
		return amount < 0 ? 'text-sage' : 'text-ink';
	}

	function signedLabel(amount: number, currency: string): string {
		const abs = formatCurrency(Math.abs(amount), currency);
		return amount < 0 ? `+${abs}` : `−${abs}`;
	}
</script>

<svelte:head>
	<title>Transactions — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-8 py-10">
	<h1 class="font-display text-2xl font-semibold">Transactions</h1>

	{#if data.uncategorizedCount > 0}
		<a
			href="/transactions?uncategorized=1"
			class="mt-4 block rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay hover:bg-clay/15"
		>
			{data.uncategorizedCount} transaction{data.uncategorizedCount === 1 ? '' : 's'} need{data.uncategorizedCount === 1 ? 's' : ''}
			a category &rarr;
		</a>
	{/if}

	{#if toast}
		<p class="mt-4 text-sm text-channel">{toast}</p>
	{/if}

	<form method="GET" class="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-4">
		<div>
			<label for="q" class="block text-xs font-medium text-ink/50">Search</label>
			<input
				id="q"
				name="q"
				type="text"
				value={data.filters.query}
				placeholder="Merchant or description"
				class="mt-1 rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
			/>
		</div>
		<div>
			<label for="account" class="block text-xs font-medium text-ink/50">Account</label>
			<select
				id="account"
				name="account"
				class="mt-1 rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
			>
				<option value="" selected={!data.filters.accountId}>All accounts</option>
				{#each data.accounts as account (account.id)}
					<option value={account.id} selected={data.filters.accountId === account.id}
						>{account.name}</option
					>
				{/each}
			</select>
		</div>
		<div>
			<label for="flow" class="block text-xs font-medium text-ink/50">Flow</label>
			<select
				id="flow"
				name="flow"
				class="mt-1 rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
			>
				<option value="" selected={!data.filters.flowId}>All flows</option>
				{#each data.flows as flow (flow.id)}
					<option value={flow.id} selected={data.filters.flowId === flow.id}>{flow.name}</option>
				{/each}
			</select>
		</div>
		<label class="flex items-center gap-2 pb-2 text-sm text-ink/70">
			<input
				type="checkbox"
				name="pending"
				value="hide"
				checked={data.filters.hidePending}
				class="rounded border-ink/30 text-channel focus:ring-channel"
			/>
			Hide pending
		</label>
		<label class="flex items-center gap-2 pb-2 text-sm text-ink/70">
			<input
				type="checkbox"
				name="uncategorized"
				value="1"
				checked={data.filters.onlyUncategorized}
				class="rounded border-ink/30 text-channel focus:ring-channel"
			/>
			Uncategorized only
		</label>
		<button
			type="submit"
			class="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:brightness-95"
		>
			Filter
		</button>
		{#if data.filters.accountId || data.filters.categoryId || data.filters.flowId || data.filters.query || data.filters.hidePending || data.filters.onlyUncategorized}
			<a href="/transactions" class="pb-2 text-sm text-ink/50 underline hover:text-ink">Clear</a>
		{/if}
	</form>

	<div class="mt-6 overflow-hidden rounded-xl border border-ink/10 bg-white">
		{#if data.transactions.length === 0}
			<p class="p-8 text-center text-sm text-ink/40">No transactions match these filters.</p>
		{:else}
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-ink/10 text-left text-xs text-ink/50 uppercase">
						<th class="px-4 py-3 font-medium">Date</th>
						<th class="px-4 py-3 font-medium">Description</th>
						<th class="px-4 py-3 font-medium">Account</th>
						<th class="px-4 py-3 font-medium">Category</th>
						<th class="px-4 py-3 text-right font-medium">Amount</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-ink/5">
					{#each data.transactions as tx (tx.id)}
						<tr>
							<td class="px-4 py-3 whitespace-nowrap text-ink/60">{formatDate(tx.date)}</td>
							<td class="max-w-xs px-4 py-3">
								<p class="truncate font-medium text-ink">{tx.merchant_name ?? tx.name}</p>
								{#if tx.pending}
									<span class="text-xs text-clay">Pending</span>
								{/if}
							</td>
							<td class="px-4 py-3 whitespace-nowrap text-ink/60">{tx.accounts?.name ?? '—'}</td>
							<td class="px-4 py-3">
								<select
									value={tx.category_id ?? ''}
									disabled={updatingId === tx.id}
									onchange={(e) => updateCategory(tx.id, e.currentTarget.value)}
									class="rounded-lg border-ink/15 bg-white py-1 text-xs text-ink shadow-sm focus:border-channel focus:ring-channel {tx.category_source ===
									'uncategorized'
										? 'border-clay/40 text-clay'
										: ''}"
								>
									{#if !tx.category_id}
										<option value="" disabled selected>Uncategorized</option>
									{/if}
									{#each groupedCategories as group (group.flowName)}
										<optgroup label={group.flowName}>
											{#each group.categories as category (category.id)}
												<option value={category.id} selected={tx.category_id === category.id}
													>{category.name}</option
												>
											{/each}
										</optgroup>
									{/each}
								</select>
							</td>
							<td class="font-mono-nums px-4 py-3 text-right {signClass(tx.amount)}">
								{signedLabel(tx.amount, tx.accounts?.iso_currency_code ?? 'USD')}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
