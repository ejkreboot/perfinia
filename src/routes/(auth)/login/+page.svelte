<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let step = $state<'email' | 'code'>('email');
	let submitting = $state(false);
	let email = $state('');
	let codeInput: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (step === 'code') codeInput?.focus();
	});

	// Mirrors the landing page's security section, so the promises a visitor
	// read before signing in are still in front of them while they do it.
	const assurances = [
		{
			title: 'Read-only by design',
			body: 'Perfinia can see balances and transactions. It cannot move money.'
		},
		{
			title: 'Credentials never stored',
			body: "You sign in to your bank on your bank's page — never here."
		},
		{
			title: 'Isolated per account',
			body: 'Row-level security means your data is reachable only by you.'
		}
	];
</script>

<svelte:head>
	<title>Sign in — Perfinia</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-paper text-ink">
	<header class="border-b border-ink/10">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
			<a href="/" class="font-display text-xl font-semibold tracking-tight">perfinia</a>
			<a href="/" class="text-sm font-medium text-ink/60 transition hover:text-ink">
				&larr; Back to home
			</a>
		</div>
	</header>

	<main class="flex flex-1 items-center justify-center px-6 py-16">
		<div class="grid w-full max-w-5xl gap-14 lg:grid-cols-2 lg:items-center">
			<!-- Sign-in card -->
			<div class="mx-auto w-full max-w-md lg:mx-0">
				<h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
					{step === 'email' ? 'Welcome back' : 'Check your email'}
				</h1>
				<p class="mt-3 text-ink/70">
					{step === 'email'
						? 'Enter your email and we will send you a one-time code — no password to remember.'
						: `We sent a 6-digit code to ${email}. It expires in a few minutes.`}
				</p>

				<div class="mt-8 rounded-2xl border border-ink/10 bg-white p-8 shadow-xl shadow-ink/5">
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
							class="space-y-5"
						>
							<div>
								<label for="email" class="block text-sm font-medium text-ink/70">Email</label>
								<input
									id="email"
									name="email"
									type="email"
									autocomplete="email"
									required
									value={form?.email ?? ''}
									placeholder="you@example.com"
									class="mt-2 block w-full rounded-lg border-ink/15 bg-white text-ink shadow-sm focus:border-channel focus:ring-channel"
								/>
							</div>

							{#if form?.error}
								<p class="text-sm text-plum" role="alert">{form.error}</p>
							{/if}

							<button
								type="submit"
								disabled={submitting}
								class="w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
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
							class="space-y-5"
						>
							<input type="hidden" name="email" value={email} />
							<div>
								<label for="code" class="block text-sm font-medium text-ink/70">6-digit code</label>
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
									class="font-mono-nums mt-2 block w-full rounded-lg border-ink/15 bg-white text-center text-lg tracking-[0.3em] text-ink shadow-sm focus:border-channel focus:ring-channel"
								/>
							</div>

							{#if form?.error}
								<p class="text-sm text-plum" role="alert">{form.error}</p>
							{/if}

							<button
								type="submit"
								disabled={submitting}
								class="w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
							>
								{submitting ? 'Verifying…' : 'Verify & sign in'}
							</button>
						</form>

						<button
							type="button"
							class="mt-5 w-full text-center text-sm text-ink/60 transition hover:text-ink"
							onclick={() => (step = 'email')}
						>
							Use a different email
						</button>
					{/if}
				</div>

				<p class="mt-6 text-sm text-ink/50">
					New here? The same code signs you in and sets up your account.
				</p>
			</div>

			<!-- Assurances -->
			<div class="hidden lg:block">
				<div class="rounded-2xl border border-ink/10 bg-paper-soft p-8">
					<p class="text-xs font-semibold tracking-widest text-ink/40 uppercase">
						Your accounts stay yours
					</p>

					<dl class="mt-6 space-y-6">
						{#each assurances as item (item.title)}
							<div>
								<dt class="font-display text-base font-semibold">{item.title}</dt>
								<dd class="mt-1.5 text-sm leading-relaxed text-ink/70">{item.body}</dd>
							</div>
						{/each}
					</dl>

					<div class="mt-8 flex gap-1.5 border-t border-ink/10 pt-6">
						<span class="h-1 flex-1 rounded-full bg-gold"></span>
						<span class="h-1 flex-1 rounded-full bg-channel"></span>
						<span class="h-1 flex-1 rounded-full bg-clay"></span>
						<span class="h-1 flex-1 rounded-full bg-sage"></span>
						<span class="h-1 flex-1 rounded-full bg-plum"></span>
					</div>
				</div>
			</div>
		</div>
	</main>

	<footer class="border-t border-ink/10">
		<div class="mx-auto max-w-6xl px-6 py-8 text-sm text-ink/50">
			&copy; {new Date().getFullYear()} Perfinia
		</div>
	</footer>
</div>
