<script lang="ts">
	import { enhance } from '$app/forms';
	import { FLOW_COLOR_TOKENS, flowColorVar } from '$lib/flowColors';
	import { formatCurrency } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let editingId = $state<string | null>(null);
	let showAddForm = $state(false);
</script>

<svelte:head>
	<title>Flows — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-8 py-10">
	<div class="mb-2 flex items-start justify-between">
		<div>
			<h1 class="font-display text-2xl font-semibold">Flows</h1>
			<p class="mt-1 text-sm text-ink/60">
				Every category belongs to a flow — the lens the dashboard uses instead of per-category
				budgets.
			</p>
		</div>
		<button
			type="button"
			onclick={() => (showAddForm = !showAddForm)}
			class="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:brightness-95"
		>
			Add flow
		</button>
	</div>

	{#if showAddForm}
		<form
			method="POST"
			action="?/create"
			use:enhance={() => async ({ update }) => {
				showAddForm = false;
				await update();
			}}
			class="mt-4 space-y-3 rounded-xl border border-ink/10 bg-white p-5"
		>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="new-name" class="block text-xs font-medium text-ink/60">Name</label>
					<input
						id="new-name"
						name="name"
						type="text"
						required
						class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
					/>
				</div>
				<div>
					<label for="new-direction" class="block text-xs font-medium text-ink/60">Direction</label>
					<select
						id="new-direction"
						name="direction"
						class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
					>
						<option value="outflow">Outflow (spending)</option>
						<option value="inflow">Inflow (income)</option>
					</select>
				</div>
				<div>
					<label for="new-target" class="block text-xs font-medium text-ink/60"
						>Monthly target (optional)</label
					>
					<input
						id="new-target"
						name="monthly_target"
						type="number"
						step="0.01"
						class="font-mono-nums mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
					/>
				</div>
				<div>
					<label for="new-color" class="block text-xs font-medium text-ink/60">Color</label>
					<select
						id="new-color"
						name="color"
						class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
					>
						{#each FLOW_COLOR_TOKENS as token (token)}
							<option value={token}>{token}</option>
						{/each}
					</select>
				</div>
			</div>
			<button
				type="submit"
				class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
			>
				Create flow
			</button>
		</form>
	{/if}

	<div class="mt-6 space-y-3">
		{#each data.flows as flow, i (flow.id)}
			<div class="rounded-xl border border-ink/10 bg-white p-4">
				<div class="flex items-center gap-3">
					<span
						class="h-3 w-3 shrink-0 rounded-full"
						style="background-color: {flowColorVar(flow.color)}"
					></span>
					<div class="min-w-0 flex-1">
						<p class="font-medium text-ink">{flow.name}</p>
						<p class="text-xs text-ink/50">
							{flow.direction === 'inflow' ? 'Inflow' : 'Outflow'}
							{#if flow.monthly_target}
								· Target {formatCurrency(flow.monthly_target)}/mo
							{/if}
							{#if !flow.counts_toward_totals}
								· Excluded from totals
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-1">
						<form method="POST" action="?/reorder" use:enhance>
							<input type="hidden" name="id" value={flow.id} />
							<input type="hidden" name="direction" value="up" />
							<button
								type="submit"
								disabled={i === 0}
								class="px-1 text-ink/40 hover:text-ink disabled:opacity-20"
								aria-label="Move up">&uarr;</button
							>
						</form>
						<form method="POST" action="?/reorder" use:enhance>
							<input type="hidden" name="id" value={flow.id} />
							<input type="hidden" name="direction" value="down" />
							<button
								type="submit"
								disabled={i === data.flows.length - 1}
								class="px-1 text-ink/40 hover:text-ink disabled:opacity-20"
								aria-label="Move down">&darr;</button
							>
						</form>
					</div>
					<button
						type="button"
						onclick={() => (editingId = editingId === flow.id ? null : flow.id)}
						class="text-xs text-ink/50 hover:text-ink"
					>
						{editingId === flow.id ? 'Close' : 'Edit'}
					</button>
					<form method="POST" action="?/archive" use:enhance>
						<input type="hidden" name="id" value={flow.id} />
						<button type="submit" class="text-xs text-ink/40 hover:text-plum">Archive</button>
					</form>
				</div>

				{#if flow.monthly_target}
					{@const pct = Math.min(100, (flow.actualThisMonth / flow.monthly_target) * 100)}
					{@const overTarget = flow.actualThisMonth > flow.monthly_target}
					<div class="mt-3">
						<div class="h-1.5 overflow-hidden rounded-full bg-ink/10">
							<div
								class="h-full rounded-full {overTarget ? 'bg-plum' : 'bg-sage'}"
								style="width: {pct}%"
							></div>
						</div>
						<p class="mt-1 text-xs text-ink/50">
							{formatCurrency(flow.actualThisMonth)} of {formatCurrency(flow.monthly_target)} this
							month
							{#if overTarget}
								<span class="text-plum">· over target</span>
							{/if}
						</p>
					</div>
				{/if}

				{#if editingId === flow.id}
					<form
						method="POST"
						action="?/update"
						use:enhance
						class="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4"
					>
						<input type="hidden" name="id" value={flow.id} />
						<div>
							<label for="name-{flow.id}" class="block text-xs font-medium text-ink/60">Name</label
							>
							<input
								id="name-{flow.id}"
								name="name"
								type="text"
								value={flow.name}
								required
								class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
							/>
						</div>
						<div>
							<label for="direction-{flow.id}" class="block text-xs font-medium text-ink/60"
								>Direction</label
							>
							<select
								id="direction-{flow.id}"
								name="direction"
								class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
							>
								<option value="outflow" selected={flow.direction === 'outflow'}
									>Outflow (spending)</option
								>
								<option value="inflow" selected={flow.direction === 'inflow'}
									>Inflow (income)</option
								>
							</select>
						</div>
						<div>
							<label for="target-{flow.id}" class="block text-xs font-medium text-ink/60"
								>Monthly target</label
							>
							<input
								id="target-{flow.id}"
								name="monthly_target"
								type="number"
								step="0.01"
								value={flow.monthly_target ?? ''}
								class="font-mono-nums mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
							/>
						</div>
						<div>
							<label for="color-{flow.id}" class="block text-xs font-medium text-ink/60"
								>Color</label
							>
							<select
								id="color-{flow.id}"
								name="color"
								class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
							>
								{#each FLOW_COLOR_TOKENS as token (token)}
									<option value={token} selected={flow.color === token}>{token}</option>
								{/each}
							</select>
						</div>
						<label class="col-span-2 flex items-center gap-2 text-sm text-ink/70">
							<input
								type="checkbox"
								name="counts_toward_totals"
								checked={flow.counts_toward_totals}
								class="rounded border-ink/30 text-channel focus:ring-channel"
							/>
							Count toward income/flow-out totals
						</label>
						<button
							type="submit"
							class="col-span-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
						>
							Save
						</button>
					</form>
				{/if}
			</div>
		{/each}
	</div>
</div>
