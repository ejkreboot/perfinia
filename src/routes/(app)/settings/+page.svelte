<script lang="ts">
	import { enhance } from '$app/forms';
	import PlaidLinkButton from '$lib/components/PlaidLinkButton.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function statusLabel(status: string): string {
		switch (status) {
			case 'active':
				return 'Connected';
			case 'error':
				return 'Needs attention';
			case 'pending_expiration':
				return 'Expiring soon';
			case 'revoked':
				return 'Disconnected';
			default:
				return status;
		}
	}

	function statusClass(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-sage/15 text-sage';
			case 'pending_expiration':
				return 'bg-clay/15 text-clay';
			default:
				return 'bg-plum/15 text-plum';
		}
	}
</script>

<svelte:head>
	<title>Settings — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-8 py-10">
	<h1 class="font-display text-2xl font-semibold">Settings</h1>

	<div class="mt-8">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wide text-ink/50 uppercase">
				Connected institutions
			</h2>
			<PlaidLinkButton label="Connect another bank" />
		</div>

		{#if data.plaidItems.length === 0}
			<p class="text-sm text-ink/40">No banks connected yet.</p>
		{:else}
			<div class="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10 bg-white">
				{#each data.plaidItems as item (item.id)}
					<div class="flex items-center justify-between gap-4 px-5 py-4">
						<div class="min-w-0">
							<p class="truncate font-medium text-ink">
								{item.institution_name ?? 'Connected institution'}
							</p>
							<p class="mt-0.5 text-xs text-ink/50">
								{#if item.last_synced_at}
									Last synced {new Date(item.last_synced_at).toLocaleString()}
								{:else}
									Not synced yet
								{/if}
							</p>
							{#if item.status === 'error' && item.error_message}
								<p class="mt-0.5 text-xs text-plum">{item.error_message}</p>
							{/if}
						</div>
						<span
							class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium {statusClass(item.status)}"
						>
							{statusLabel(item.status)}
						</span>
						<form method="POST" action="/api/plaid/item/{item.id}/remove">
							<button type="submit" class="shrink-0 text-xs text-ink/40 hover:text-plum">
								Remove
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-10">
		<h2 class="mb-3 text-xs font-medium tracking-wide text-ink/50 uppercase">Extra shifts</h2>
		<div class="rounded-xl border border-ink/10 bg-white p-5">
			<p class="text-sm text-ink/60">
				What does one extra shift typically net you, after taxes? The dashboard uses this to turn
				an income shortfall into "pick up about N shifts" instead of just a dollar figure.
			</p>
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance
				class="mt-4 flex items-end gap-3"
			>
				<div>
					<label for="shift-estimate" class="block text-xs font-medium text-ink/60"
						>Per-shift take-home</label
					>
					<div class="relative mt-1">
						<span class="absolute top-2.5 left-3 text-ink/40">$</span>
						<input
							id="shift-estimate"
							name="default_shift_income_estimate"
							type="number"
							step="0.01"
							value={data.profile.default_shift_income_estimate ?? ''}
							placeholder="e.g. 600"
							class="font-mono-nums block w-40 rounded-lg border-ink/15 bg-white pl-7 text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
						/>
					</div>
				</div>
				<button
					type="submit"
					class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
				>
					Save
				</button>
			</form>
			{#if form?.error}
				<p class="mt-3 text-sm text-plum" role="alert">{form.error}</p>
			{/if}
		</div>
	</div>
</div>
