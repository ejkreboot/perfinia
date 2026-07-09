<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const nav = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/accounts', label: 'Accounts' },
		{ href: '/transactions', label: 'Transactions' },
		{ href: '/categories', label: 'Categories' },
		{ href: '/flows', label: 'Flows' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<div class="flex min-h-screen bg-paper text-ink">
	<aside class="flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white px-5 py-6">
		<p class="font-display px-1 text-xl font-semibold tracking-tight">perfinia</p>

		<nav class="mt-8 flex flex-1 flex-col gap-1">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class="rounded-lg px-3 py-2 text-sm font-medium transition {page.url.pathname.startsWith(
						item.href
					)
						? 'bg-gold/15 text-ink'
						: 'text-ink/60 hover:bg-ink/5 hover:text-ink'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<form method="POST" action="/logout">
			<button
				type="submit"
				class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink/50 transition hover:bg-ink/5 hover:text-ink"
			>
				Sign out
			</button>
		</form>
	</aside>

	<main class="flex-1">
		{@render children()}
	</main>
</div>
