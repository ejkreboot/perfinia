<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { label = 'Connect a bank' }: { label?: string } = $props();

	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	function loadLinkScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (window.Plaid) return resolve();
			const existing = document.getElementById('plaid-link-script');
			if (existing) {
				existing.addEventListener('load', () => resolve());
				return;
			}
			const script = document.createElement('script');
			script.id = 'plaid-link-script';
			script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Could not load Plaid.'));
			document.head.appendChild(script);
		});
	}

	async function openLink() {
		loading = true;
		errorMessage = null;

		try {
			await loadLinkScript();

			const tokenResponse = await fetch('/api/plaid/link-token', { method: 'POST' });
			if (!tokenResponse.ok) throw new Error('Could not start Plaid Link.');
			const { linkToken } = await tokenResponse.json();

			const handler = window.Plaid.create({
				token: linkToken,
				onSuccess: async (publicToken) => {
					const exchangeResponse = await fetch('/api/plaid/exchange-token', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ public_token: publicToken })
					});
					if (!exchangeResponse.ok) {
						errorMessage = 'Connected, but importing your accounts failed. Try refreshing.';
					}
					await invalidateAll();
					loading = false;
				},
				onExit: (err) => {
					loading = false;
					if (err) errorMessage = 'Connection was not completed.';
				}
			});

			handler.open();
		} catch (err) {
			loading = false;
			errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
		}
	}
</script>

<div>
	<button
		type="button"
		onclick={openLink}
		disabled={loading}
		class="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:brightness-95 disabled:opacity-60"
	>
		{loading ? 'Connecting…' : label}
	</button>
	{#if errorMessage}
		<p class="mt-2 text-sm text-plum">{errorMessage}</p>
	{/if}
</div>
