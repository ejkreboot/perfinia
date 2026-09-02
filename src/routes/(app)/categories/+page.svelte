<script lang="ts">
	import { enhance } from '$app/forms';
	import { flowColorVar } from '$lib/flowColors';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let showAddForm = $state(false);

	let groups = $derived.by(() => {
		const byFlow = new Map<
			string,
			{ flowId: string; flowName: string; color: string | null; categories: typeof data.categories }
		>();
		for (const category of data.categories) {
			const flow = category.flows;
			const key = flow?.id ?? 'none';
			const entry = byFlow.get(key) ?? {
				flowId: key,
				flowName: flow?.name ?? 'Unassigned',
				color: flow?.color ?? null,
				categories: []
			};
			entry.categories.push(category);
			byFlow.set(key, entry);
		}
		const flowOrder = new Map(data.flows.map((f, i) => [f.id, i]));
		return [...byFlow.values()].sort(
			(a, b) => (flowOrder.get(a.flowId) ?? 99) - (flowOrder.get(b.flowId) ?? 99)
		);
	});
</script>

<svelte:head>
	<title>Categories — Perfinia</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-8 py-10">
	<div class="mb-2 flex items-start justify-between">
		<div>
			<h1 class="font-display text-2xl font-semibold">Categories</h1>
			<p class="mt-1 text-sm text-ink/60">
				Granular, for search and tracking — every category maps to exactly one flow.
			</p>
		</div>
		<button
			type="button"
			onclick={() => (showAddForm = !showAddForm)}
			class="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:brightness-95"
		>
			Add category
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
					<label for="new-cat-name" class="block text-xs font-medium text-ink/60">Name</label>
					<input
						id="new-cat-name"
						name="name"
						type="text"
						required
						class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
					/>
				</div>
				<div>
					<label for="new-cat-flow" class="block text-xs font-medium text-ink/60">Flow</label>
					<select
						id="new-cat-flow"
						name="flow_id"
						required
						class="mt-1 w-full rounded-lg border-ink/15 bg-white text-sm text-ink shadow-sm focus:border-channel focus:ring-channel"
					>
						{#each data.flows as flow (flow.id)}
							<option value={flow.id}>{flow.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<label class="flex items-center gap-2 text-sm text-ink/70">
				<input
					type="checkbox"
					name="is_supplemental_income"
					class="rounded border-ink/30 text-channel focus:ring-channel"
				/>
				Supplemental income (e.g. bonuses, overtime)
			</label>
			<button
				type="submit"
				class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
			>
				Create category
			</button>
		</form>
	{/if}

	{#each groups as group (group.flowId)}
		<div class="mt-8">
			<h2 class="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-ink/50 uppercase">
				<span
					class="h-2.5 w-2.5 rounded-full"
					style="background-color: {flowColorVar(group.color)}"
				></span>
				{group.flowName}
			</h2>
			<div class="divide-y divide-ink/5 overflow-hidden rounded-xl border border-ink/10 bg-white">
				{#each group.categories as category (category.id)}
					<div class="flex items-center gap-3 px-4 py-3">
						<p class="min-w-0 flex-1 truncate text-sm font-medium text-ink">
							{category.name}
							{#if category.is_supplemental_income}
								<span class="ml-1 text-xs font-normal text-gold">· supplemental</span>
							{/if}
						</p>
						<form method="POST" action="?/update" use:enhance class="flex items-center gap-2">
							<input type="hidden" name="id" value={category.id} />
							<input type="hidden" name="name" value={category.name} />
							<input
								type="hidden"
								name="is_supplemental_income"
								value={category.is_supplemental_income ? 'on' : ''}
							/>
							<select
								name="flow_id"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="rounded-lg border-ink/15 bg-white py-1 text-xs text-ink shadow-sm focus:border-channel focus:ring-channel"
							>
								{#each data.flows as flow (flow.id)}
									<option value={flow.id} selected={category.flow_id === flow.id}
										>{flow.name}</option
									>
								{/each}
							</select>
						</form>
						<form method="POST" action="?/archive" use:enhance>
							<input type="hidden" name="id" value={category.id} />
							<button type="submit" class="text-xs text-ink/40 hover:text-plum">Archive</button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
