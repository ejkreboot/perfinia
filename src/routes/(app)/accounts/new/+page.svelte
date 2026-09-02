<script lang="ts">
	import { enhance } from '$app/forms';
	import { ACCOUNT_TYPE_OPTIONS, accountGroupLabel } from '$lib/accountTypes';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);

	let groupedOptions = $derived.by(() => {
		const byGroup = new Map<string, typeof ACCOUNT_TYPE_OPTIONS>();
		for (const option of ACCOUNT_TYPE_OPTIONS) {
			const label = accountGroupLabel(option.type);
			const list = byGroup.get(label) ?? [];
			list.push(option);
			byGroup.set(label, list);
		}
		return [...byGroup.entries()];
	});
</script>

<svelte:head>
	<title>Add account — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-lg px-8 py-10">
	<a href="/accounts" class="text-sm text-ink/50 hover:text-ink">&larr; Accounts</a>
	<h1 class="font-display mt-2 text-2xl font-semibold">Add a manual account</h1>
	<p class="mt-1 text-sm text-ink/60">
		For anything not linked through Plaid — a 401(k) held elsewhere, home equity, a paper savings
		bond. You'll be able to link real institutions once Plaid is connected.
	</p>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="mt-8 space-y-5 rounded-xl border border-ink/10 bg-white p-6"
	>
		<div>
			<label for="name" class="block text-sm font-medium text-ink/80">Account name</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				value={form?.name ?? ''}
				placeholder="e.g. Fidelity 401(k)"
				class="mt-1 block w-full rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
			/>
		</div>

		<div>
			<label for="option" class="block text-sm font-medium text-ink/80">Type</label>
			<select
				id="option"
				name="option"
				required
				value={form?.optionKey ?? ''}
				class="mt-1 block w-full rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
			>
				<option value="" disabled selected>Choose a type&hellip;</option>
				{#each groupedOptions as [groupLabel, options] (groupLabel)}
					<optgroup label={groupLabel}>
						{#each options as option (`${option.type}:${option.subtype}`)}
							<option value="{option.type}:{option.subtype}">{option.label}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</div>

		<div>
			<label for="balance" class="block text-sm font-medium text-ink/80">Current balance</label>
			<div class="relative mt-1">
				<span class="absolute top-2.5 left-3 text-ink/40">$</span>
				<input
					id="balance"
					name="balance"
					type="number"
					step="0.01"
					required
					value={form?.balanceRaw ?? ''}
					placeholder="0.00"
					class="font-mono-nums block w-full rounded-lg border-ink/15 bg-white pl-7 text-ink shadow-sm focus:border-channel focus:ring-channel"
				/>
			</div>
			<p class="mt-1 text-xs text-ink/40">
				For a liability (credit card, loan), enter the amount owed as a positive number.
			</p>
		</div>

		{#if form?.error}
			<p class="text-sm text-plum" role="alert">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-lg bg-gold px-4 py-2.5 font-medium text-ink transition hover:brightness-95 disabled:opacity-60"
		>
			{submitting ? 'Adding…' : 'Add account'}
		</button>
	</form>
</div>
