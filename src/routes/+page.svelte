<script lang="ts">
	// Public marketing page. Signed-in users never see this — +page.server.ts
	// redirects them to /dashboard.

	const flows = [
		{ name: 'Income', color: 'var(--color-gold)', share: 100 },
		{ name: 'Fixed & Essential', color: 'var(--color-channel)', share: 46 },
		{ name: 'Discretionary & Goals', color: 'var(--color-clay)', share: 24 },
		{ name: 'Savings & Investing', color: 'var(--color-sage)', share: 21 },
		{ name: 'Debt Paydown', color: 'var(--color-plum)', share: 9 }
	];

	const features = [
		{
			title: 'Every dollar lands in a flow',
			body: 'Transactions are categorized on arrival and rolled up into five flows — income, essentials, discretionary, savings, debt. One glance tells you the shape of your month.',
			color: 'var(--color-gold)'
		},
		{
			title: 'Accounts that sync themselves',
			body: 'Connect banks, cards, loans, and brokerages through Plaid. Balances and transactions refresh in the background, and manual accounts cover whatever your bank cannot.',
			color: 'var(--color-channel)'
		},
		{
			title: 'Net worth over time',
			body: 'Assets minus liabilities, tracked automatically from every connected balance, charted so you can see the trend instead of guessing at it.',
			color: 'var(--color-sage)'
		},
		{
			title: 'Budget versus actual',
			body: 'Set a target for each flow and see where the month stands against it — while there is still time to change the outcome.',
			color: 'var(--color-clay)'
		},
		{
			title: 'Recurring charges, surfaced',
			body: 'Subscriptions and repeating bills are detected from your own history, so the quiet monthly drains stop being invisible.',
			color: 'var(--color-plum)'
		},
		{
			title: 'Your categories, your call',
			body: 'Rename flows, add categories, and override any transaction. Corrections stick, so the system learns the way you actually think about money.',
			color: 'var(--color-channel)'
		}
	];

	const steps = [
		{
			n: '01',
			title: 'Connect your accounts',
			body: 'Link checking, savings, credit, loans, and investments in a few minutes. Add anything else by hand.'
		},
		{
			n: '02',
			title: 'Let it sort itself out',
			body: 'History is backfilled and categorized into flows automatically. Adjust anything that lands in the wrong place.'
		},
		{
			n: '03',
			title: 'Watch the shape of your month',
			body: 'Income in, five flows out, net worth over time — updated as transactions arrive.'
		}
	];
</script>

<svelte:head>
	<title>Perfinia — See where your money actually goes</title>
	<meta
		name="description"
		content="Perfinia connects your accounts, sorts every transaction into five flows, and shows you the shape of your month — income, essentials, discretionary, savings, and debt."
	/>
</svelte:head>

<div class="min-h-screen bg-paper text-ink">
	<!-- Header -->
	<header class="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
			<a href="/" class="font-display text-xl font-semibold tracking-tight">perfinia</a>

			<nav class="hidden items-center gap-8 text-sm text-ink/70 md:flex">
				<a href="#features" class="transition hover:text-ink">Features</a>
				<a href="#how" class="transition hover:text-ink">How it works</a>
				<a href="#security" class="transition hover:text-ink">Security</a>
			</nav>

			<div class="flex items-center gap-3">
				<a
					href="/login"
					class="hidden text-sm font-medium text-ink/70 transition hover:text-ink sm:block"
				>
					Sign in
				</a>
				<a
					href="/login"
					class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
				>
					Get started
				</a>
			</div>
		</div>
	</header>

	<!-- Hero -->
	<section class="border-b border-ink/10">
		<div class="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
			<div>
				<p
					class="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-medium tracking-wide text-ink/60 uppercase"
				>
					Personal finance, clearly
				</p>

				<h1
					class="font-display mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl"
				>
					See where your money actually goes.
				</h1>

				<p class="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
					Perfinia connects your accounts, sorts every transaction into five flows, and turns a
					month of noise into one honest picture — what came in, where it went, and what it left
					behind.
				</p>

				<div class="mt-9 flex flex-col gap-3 sm:flex-row">
					<a
						href="/login"
						class="rounded-lg bg-gold px-6 py-3 text-center text-sm font-semibold text-ink transition hover:brightness-95"
					>
						Get started free
					</a>
					<a
						href="#how"
						class="rounded-lg border border-ink/15 bg-white px-6 py-3 text-center text-sm font-semibold text-ink transition hover:border-ink/30"
					>
						See how it works
					</a>
				</div>

				<p class="mt-6 text-sm text-ink/50">No credit card. Bank connections are read-only.</p>
			</div>

			<!-- Product preview -->
			<div>
				<div
					class="rounded-2xl border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5"
					aria-hidden="true"
				>
					<div class="flex items-start justify-between gap-6">
						<div>
							<p class="text-sm font-medium text-ink/50">Net worth</p>
							<p class="font-mono-nums mt-1 text-3xl font-semibold tracking-tight">$248,310</p>
							<p class="font-mono-nums mt-1 text-xs font-medium text-sage">+2.4% this month</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium text-ink/50">Savings rate</p>
							<p class="font-mono-nums mt-1 text-3xl font-semibold tracking-tight text-sage">21%</p>
						</div>
					</div>

					<svg class="mt-5 h-24 w-full" viewBox="0 0 320 96" fill="none" preserveAspectRatio="none">
						<defs>
							<linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="var(--color-sage)" stop-opacity="0.28" />
								<stop offset="100%" stop-color="var(--color-sage)" stop-opacity="0" />
							</linearGradient>
						</defs>
						<path
							d="M0 78 L40 72 L80 74 L120 60 L160 56 L200 44 L240 46 L280 30 L320 20 L320 96 L0 96 Z"
							fill="url(#nw)"
						/>
						<path
							d="M0 78 L40 72 L80 74 L120 60 L160 56 L200 44 L240 46 L280 30 L320 20"
							stroke="var(--color-sage)"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<div class="mt-6 border-t border-ink/10 pt-5">
						<p class="text-sm font-medium text-ink/50">This month's flow allocation</p>

						<div class="mt-3 flex h-2.5 overflow-hidden rounded-full bg-paper-soft">
							{#each flows.slice(1) as flow (flow.name)}
								<div style="width: {flow.share}%; background-color: {flow.color}"></div>
							{/each}
						</div>

						<dl class="mt-4 space-y-2.5">
							{#each flows.slice(1) as flow (flow.name)}
								<div class="flex items-center justify-between text-sm">
									<dt class="flex items-center gap-2 text-ink/70">
										<span class="h-2.5 w-2.5 rounded-full" style="background-color: {flow.color}"
										></span>
										{flow.name}
									</dt>
									<dd class="font-mono-nums text-ink/60">{flow.share}%</dd>
								</div>
							{/each}
						</dl>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section id="features" class="scroll-mt-16 border-b border-ink/10">
		<div class="mx-auto max-w-6xl px-6 py-20 lg:py-24">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold tracking-widest text-ink/40 uppercase">Features</p>
				<h2 class="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
					Built around flows, not spreadsheets
				</h2>
				<p class="mt-4 text-lg text-ink/70">
					Most tools bury you in categories. Perfinia keeps five, because five is what you can
					actually hold in your head — and act on.
				</p>
			</div>

			<div
				class="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3"
			>
				{#each features as feature (feature.title)}
					<div class="bg-white p-8">
						<span class="block h-1 w-10 rounded-full" style="background-color: {feature.color}"
						></span>
						<h3 class="font-display mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
						<p class="mt-3 text-sm leading-relaxed text-ink/70">{feature.body}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section id="how" class="scroll-mt-16 border-b border-ink/10 bg-paper-soft">
		<div class="mx-auto max-w-6xl px-6 py-20 lg:py-24">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold tracking-widest text-ink/40 uppercase">How it works</p>
				<h2 class="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
					Set up once. Then mostly just look.
				</h2>
			</div>

			<ol class="mt-14 grid gap-8 md:grid-cols-3">
				{#each steps as step (step.n)}
					<li class="rounded-2xl border border-ink/10 bg-white p-8">
						<p class="font-mono-nums text-sm font-semibold text-ink/35">{step.n}</p>
						<h3 class="font-display mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
						<p class="mt-3 text-sm leading-relaxed text-ink/70">{step.body}</p>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<!-- Security -->
	<section id="security" class="scroll-mt-16 border-b border-ink/10">
		<div class="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-24">
			<div>
				<p class="text-xs font-semibold tracking-widest text-ink/40 uppercase">Security</p>
				<h2 class="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
					Your accounts stay yours
				</h2>
				<p class="mt-4 text-lg text-ink/70">
					Perfinia reads balances and transactions. It cannot move money, and it never needs to.
				</p>
			</div>

			<dl class="grid gap-6 sm:grid-cols-2">
				<div>
					<dt class="font-display text-base font-semibold">Read-only by design</dt>
					<dd class="mt-2 text-sm leading-relaxed text-ink/70">
						Connections are established through Plaid and scoped to reading. No transfers, no
						payments, no write access.
					</dd>
				</div>
				<div>
					<dt class="font-display text-base font-semibold">Credentials never stored</dt>
					<dd class="mt-2 text-sm leading-relaxed text-ink/70">
						You sign in to your bank on your bank's page. Perfinia holds a revocable token, not your
						password.
					</dd>
				</div>
				<div>
					<dt class="font-display text-base font-semibold">Isolated per account</dt>
					<dd class="mt-2 text-sm leading-relaxed text-ink/70">
						Row-level security in the database means your data is reachable only by you, enforced at
						the storage layer.
					</dd>
				</div>
				<div>
					<dt class="font-display text-base font-semibold">Disconnect anytime</dt>
					<dd class="mt-2 text-sm leading-relaxed text-ink/70">
						Remove an institution from Settings and its access is revoked along with the data it
						brought in.
					</dd>
				</div>
			</dl>
		</div>
	</section>

	<!-- Closing CTA -->
	<section class="bg-ink text-paper">
		<div class="mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
			<h2 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
				Know where things stand.
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-lg text-paper/70">
				Connect your accounts and see your first month in flows within minutes.
			</p>
			<a
				href="/login"
				class="mt-9 inline-block rounded-lg bg-gold px-7 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
			>
				Get started free
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-ink/10 bg-paper">
		<div
			class="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-ink/50 sm:flex-row sm:items-center sm:justify-between"
		>
			<p class="font-display text-base font-semibold tracking-tight text-ink">perfinia</p>
			<div class="flex gap-6">
				<a href="#features" class="transition hover:text-ink">Features</a>
				<a href="#security" class="transition hover:text-ink">Security</a>
				<a href="/login" class="transition hover:text-ink">Sign in</a>
			</div>
			<p>&copy; {new Date().getFullYear()} Perfinia</p>
		</div>
	</footer>
</div>
