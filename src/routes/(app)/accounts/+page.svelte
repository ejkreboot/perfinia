<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { accountGroupLabel, accountGroupOrder, accountTypeLabel } from '$lib/accountTypes';
	import { formatCurrency } from '$lib/format';
	import PlaidLinkButton from '$lib/components/PlaidLinkButton.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let syncing = $state(false);

	async function syncNow() {
		syncing = true;
		try {
			await fetch('/api/plaid/sync', { method: 'POST' });
			await invalidateAll();
		} finally {
			syncing = false;
		}
	}

	let totalAssets = $derived(
		data.accounts.filter((a) => a.is_asset).reduce((sum, a) => sum + (a.current_balance ?? 0), 0)
	);
	let totalLiabilities = $derived(
		data.accounts.filter((a) => !a.is_asset).reduce((sum, a) => sum + (a.current_balance ?? 0), 0)
	);
	let netWorth = $derived(totalAssets - totalLiabilities);

	let groups = $derived.by(() => {
		const byType = new Map<string, typeof data.accounts>();
		for (const account of data.accounts) {
			const list = byType.get(account.type) ?? [];
			list.push(account);
			byType.set(account.type, list);
		}
		return [...byType.entries()]
			.sort(([a], [b]) => accountGroupOrder(a) - accountGroupOrder(b))
			.map(([type, accounts]) => ({ type, label: accountGroupLabel(type), accounts }));
	});
</script>

<svelte:head>
	<title>Accounts — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-8 py-10">
	<div class="mb-8 flex items-start justify-between">
		<div>
			<h1 class="font-display text-2xl font-semibold">Accounts</h1>
			<p class="mt-1 text-sm text-ink/60">Track balances across every account, manual or linked.</p>
		</div>
		<div class="flex items-center gap-3">
			<a href="/accounts/new" class="text-sm text-ink/60 underline hover:text-ink">
				Add manual account
			</a>
			<button
				type="button"
				onclick={syncNow}
				disabled={syncing}
				class="text-sm text-ink/60 hover:text-ink disabled:opacity-50"
			>
				{syncing ? 'Syncing…' : 'Sync now'}
			</button>
			<PlaidLinkButton />
		</div>
	</div>

	<div class="mb-10 grid grid-cols-3 gap-4">
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-xs font-medium tracking-wide text-ink/50 uppercase">Total Assets</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-sage">
				{formatCurrency(totalAssets)}
			</p>
		</div>
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-xs font-medium tracking-wide text-ink/50 uppercase">Total Liabilities</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-plum">
				{formatCurrency(totalLiabilities)}
			</p>
		</div>
		<div class="rounded-xl border border-ink/10 bg-ink p-5">
			<p class="text-xs font-medium tracking-wide text-paper/50 uppercase">Net Worth</p>
			<p class="font-mono-nums mt-1 text-xl font-semibold text-gold">
				{formatCurrency(netWorth)}
			</p>
		</div>
	</div>

	{#if data.accounts.length === 0}
		<div class="rounded-xl border border-dashed border-ink/20 p-10 text-center text-ink/50">
			No accounts yet. <a href="/accounts/new" class="text-channel underline">Add your first one</a
			>.
		</div>
	{/if}

	{#each groups as group (group.type)}
		<div class="mb-8">
			<h2 class="mb-3 text-xs font-medium tracking-wide text-ink/50 uppercase">{group.label}</h2>
			<div class="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10 bg-white">
				{#each group.accounts as account (account.id)}
					<div class="flex items-center justify-between gap-4 px-5 py-4">
						<a href="/accounts/{account.id}" class="min-w-0 flex-1">
							<p class="truncate font-medium text-ink">{account.name}</p>
							<p class="text-xs text-ink/50">
								{accountTypeLabel(account.type, account.subtype)}
								{account.is_manual ? '· Manual' : ''}
							</p>
						</a>
						<p class="font-mono-nums text-sm font-medium {account.is_asset ? 'text-ink' : 'text-plum'}">
							{formatCurrency(account.current_balance ?? 0, account.iso_currency_code)}
						</p>
						<form method="POST" action="?/archive" use:enhance>
							<input type="hidden" name="id" value={account.id} />
							<button
								type="submit"
								class="text-xs text-ink/40 hover:text-plum"
								title="Archive account"
							>
								Archive
							</button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
