<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { stale }: { stale: boolean } = $props();

	let status = $state<'idle' | 'syncing' | 'failed'>('idle');

	// Fires at most once per page load. The layout's `stale` flag flips back to
	// false after a successful sync + invalidateAll, so a completed run can't
	// re-trigger itself; this guard covers the failure case, where the item
	// stays stale and would otherwise loop.
	let attempted = false;

	$effect(() => {
		if (stale && !attempted) {
			attempted = true;
			sync();
		}
	});

	async function sync() {
		status = 'syncing';
		try {
			const response = await fetch('/api/plaid/sync-stale', { method: 'POST' });
			if (!response.ok) throw new Error(String(response.status));

			const { failed } = await response.json();
			if (failed > 0) {
				status = 'failed';
				return;
			}

			await invalidateAll();
			status = 'idle';
		} catch {
			status = 'failed';
		}
	}

	function retry() {
		if (status !== 'syncing') sync();
	}
</script>

{#if status !== 'idle'}
	<div class="mb-3 flex items-center gap-2 px-1 text-xs text-ink/50" aria-live="polite">
		{#if status === 'syncing'}
			<span class="size-1.5 shrink-0 animate-pulse rounded-full bg-gold" aria-hidden="true"></span>
			<span>Syncing accounts…</span>
		{:else}
			<span class="size-1.5 shrink-0 rounded-full bg-ink/25" aria-hidden="true"></span>
			<span>Sync failed</span>
			<button
				type="button"
				onclick={retry}
				class="font-medium text-ink/70 underline underline-offset-2 transition hover:text-ink"
			>
				Retry
			</button>
		{/if}
	</div>
{/if}
