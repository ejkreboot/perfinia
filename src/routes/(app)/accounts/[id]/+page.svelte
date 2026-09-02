<script lang="ts">
	import { enhance } from '$app/forms';
	import { accountDisplayName, accountTypeLabel } from '$lib/accountTypes';
	import { formatCurrency, formatDate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);
	let displayName = $derived(accountDisplayName(data.account));
	const today = new Date().toISOString().slice(0, 10);

	function confirmDelete(event: SubmitEvent) {
		if (!confirm(`Permanently delete "${displayName}"? This removes its balance history too.`)) {
			event.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>{displayName} — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-8 py-10">
	<a href="/accounts" class="text-sm text-ink/50 hover:text-ink">&larr; Accounts</a>

	<div class="mt-2 flex items-start justify-between">
		<div>
			<h1 class="font-display text-2xl font-semibold">{displayName}</h1>
			<p class="mt-1 text-sm text-ink/50">
				{accountTypeLabel(data.account.type, data.account.subtype)}
				{data.account.mask ? `· ••••${data.account.mask}` : ''}
				{data.account.nickname ? `· ${data.account.name}` : ''}
				{data.account.is_manual ? '· Manual account' : ''}
			</p>
		</div>
		<p
			class="font-mono-nums text-2xl font-semibold {data.account.is_asset
				? 'text-ink'
				: 'text-plum'}"
		>
			{formatCurrency(data.account.current_balance ?? 0, data.account.iso_currency_code)}
		</p>
	</div>

	<div class="mt-8 rounded-xl border border-ink/10 bg-white p-6">
		<h2 class="text-sm font-semibold text-ink">Nickname</h2>
		<p class="mt-1 text-xs text-ink/50">
			Distinguishes this from other accounts at the same institution. Leave blank to use &ldquo;{data
				.account.name}&rdquo;.
		</p>
		<form method="POST" action="?/rename" use:enhance class="mt-4 flex items-end gap-3">
			<div class="flex-1">
				<label for="nickname" class="sr-only">Nickname</label>
				<input
					id="nickname"
					name="nickname"
					value={data.account.nickname ?? ''}
					placeholder={data.account.name}
					class="block w-full rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
				/>
			</div>
			<button
				type="submit"
				class="rounded-lg border border-ink/15 px-4 py-2 font-medium text-ink transition hover:bg-ink/5"
			>
				Save
			</button>
		</form>
	</div>

	<div class="mt-8 rounded-xl border border-ink/10 bg-white p-6">
		<h2 class="text-sm font-semibold text-ink">Update balance</h2>
		<form
			method="POST"
			action="?/updateBalance"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="mt-4 flex items-end gap-3"
		>
			<div class="flex-1">
				<label for="balance" class="block text-xs font-medium text-ink/60">Balance</label>
				<div class="relative mt-1">
					<span class="absolute top-2.5 left-3 text-ink/40">$</span>
					<input
						id="balance"
						name="balance"
						type="number"
						step="0.01"
						required
						class="font-mono-nums block w-full rounded-lg border-ink/15 bg-white pl-7 text-ink shadow-sm focus:border-channel focus:ring-channel"
					/>
				</div>
			</div>
			<div>
				<label for="as_of_date" class="block text-xs font-medium text-ink/60">As of</label>
				<input
					id="as_of_date"
					name="as_of_date"
					type="date"
					required
					value={today}
					max={today}
					class="mt-1 block rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
				/>
			</div>
			<button
				type="submit"
				disabled={submitting}
				class="rounded-lg bg-gold px-4 py-2 font-medium text-ink transition hover:brightness-95 disabled:opacity-60"
			>
				{submitting ? 'Saving…' : 'Save'}
			</button>
		</form>
		{#if form?.error}
			<p class="mt-3 text-sm text-plum" role="alert">{form.error}</p>
		{/if}
	</div>

	<div class="mt-8">
		<h2 class="mb-3 text-xs font-medium tracking-wide text-ink/50 uppercase">Balance history</h2>
		{#if data.snapshots.length === 0}
			<p class="text-sm text-ink/40">No balance history yet.</p>
		{:else}
			<div class="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10 bg-white">
				{#each data.snapshots as snapshot (snapshot.id)}
					<div class="flex items-center justify-between px-5 py-3">
						<p class="text-sm text-ink/70">{formatDate(snapshot.as_of_date)}</p>
						<p class="font-mono-nums text-sm font-medium">
							{formatCurrency(snapshot.current_balance, data.account.iso_currency_code)}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-8 flex items-center gap-4 border-t border-ink/10 pt-6">
		{#if data.account.is_archived}
			<form method="POST" action="?/unarchive" use:enhance>
				<button type="submit" class="text-sm text-channel hover:underline">Unarchive account</button
				>
			</form>
		{:else}
			<form method="POST" action="?/archive" use:enhance>
				<button type="submit" class="text-sm text-ink/50 hover:text-ink">Archive account</button>
			</form>
		{/if}
		<form method="POST" action="?/delete" use:enhance onsubmit={confirmDelete}>
			<button type="submit" class="text-sm text-plum hover:underline">Delete permanently</button>
		</form>
	</div>
</div>
