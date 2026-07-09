<script lang="ts">
	import { enhance } from '$app/forms';
	import FlowRibbon from '$lib/components/FlowRibbon.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let step = $state<'email' | 'code'>('email');
	let submitting = $state(false);
	let email = $state('');
	let codeInput: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (step === 'code') codeInput?.focus();
	});
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
					{step === 'email'
						? 'Sign in to see where things stand.'
						: `We sent a code to ${email}.`}
				</p>
			</div>

			<div class="rounded-2xl bg-paper p-8 text-ink shadow-2xl shadow-black/40">
				{#if step === 'email'}
					<form
						method="POST"
						action="?/sendCode"
						use:enhance={() => {
							submitting = true;
							return async ({ update, result }) => {
								await update();
								submitting = false;
								if (result.type === 'success' && result.data?.step === 'code') {
									step = 'code';
									email = String(result.data.email ?? email);
								}
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

						{#if form?.error}
							<p class="text-sm text-plum" role="alert">{form.error}</p>
						{/if}

						<button
							type="submit"
							disabled={submitting}
							class="w-full rounded-lg bg-gold px-4 py-2.5 font-medium text-ink transition hover:brightness-95 disabled:opacity-60"
						>
							{submitting ? 'Sending…' : 'Send code'}
						</button>
					</form>
				{:else}
					<form
						method="POST"
						action="?/verifyCode"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
							};
						}}
						class="space-y-4"
					>
						<input type="hidden" name="email" value={email} />
						<div>
							<label for="code" class="block text-sm font-medium text-ink/80">6-digit code</label>
							<input
								bind:this={codeInput}
								id="code"
								name="code"
								type="text"
								inputmode="numeric"
								autocomplete="one-time-code"
								maxlength="6"
								required
								placeholder="123456"
								class="font-mono-nums mt-1 block w-full rounded-lg border-ink/15 bg-white text-center text-lg tracking-[0.3em] text-ink shadow-sm focus:border-channel focus:ring-channel"
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
							{submitting ? 'Verifying…' : 'Verify & sign in'}
						</button>
					</form>

					<button
						type="button"
						class="mt-5 w-full text-center text-sm text-ink/60 hover:text-ink"
						onclick={() => (step = 'email')}
					>
						Use a different email
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
