<script lang="ts">
	import { enhance } from '$app/forms';
	import FlowRibbon from '$lib/components/FlowRibbon.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in — Perfinia</title>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-ink text-paper">
	<FlowRibbon class="pointer-events-none absolute inset-0 h-full w-full" />

	<div class="relative flex min-h-screen items-center justify-center px-6 py-16">
		<div class="w-full max-w-sm">
			<div class="mb-10 text-center">
				<p class="font-display text-3xl font-semibold tracking-tight text-paper">perfinia</p>
				<p class="mt-2 text-sm text-paper/60">
					{mode === 'signin' ? 'Sign in to see where things stand.' : 'Set up your account.'}
				</p>
			</div>

			<div class="rounded-2xl bg-paper p-8 text-ink shadow-2xl shadow-black/40">
				<form
					method="POST"
					action={mode === 'signin' ? '?/signin' : '?/signup'}
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="email" class="block text-sm font-medium text-ink/80">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							value={form?.email ?? ''}
							class="mt-1 block w-full rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-ink/80">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
							required
							minlength={mode === 'signup' ? 8 : undefined}
							class="mt-1 block w-full rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
						/>
					</div>

					{#if form?.error}
						<p class="text-sm text-plum" role="alert">{form.error}</p>
					{/if}

					<button
						type="submit"
						disabled={submitting}
						class="w-full rounded-lg bg-gold px-4 py-2.5 font-medium text-ink transition hover:brightness-95 disabled:opacity-60"
					>
						{#if submitting}
							Working…
						{:else if mode === 'signin'}
							Sign in
						{:else}
							Create account
						{/if}
					</button>
				</form>

				<button
					type="button"
					class="mt-5 w-full text-center text-sm text-ink/60 hover:text-ink"
					onclick={() => (mode = mode === 'signin' ? 'signup' : 'signin')}
				>
					{mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
				</button>
			</div>
		</div>
	</div>
</div>
