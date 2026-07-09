import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { FLOW_COLOR_TOKENS } from '$lib/flowColors';

function startOfMonth(): string {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: flows, error } = await supabase
		.from('flows')
		.select('id, name, direction, counts_toward_totals, monthly_target, color, sort_order')
		.eq('is_archived', false)
		.order('sort_order');

	if (error) throw error;

	const { data: monthTransactions } = await supabase
		.from('transactions')
		.select('amount, categories ( flow_id )')
		.gte('date', startOfMonth());

	const directionByFlow = new Map((flows ?? []).map((f) => [f.id, f.direction]));

	const actualByFlow = new Map<string, number>();
	for (const tx of monthTransactions ?? []) {
		const flowId = tx.categories?.flow_id;
		if (!flowId) continue;
		// Outflow flows: positive = spend. Inflow flows: flip sign so positive =
		// income received (Plaid's convention has inflow transactions negative).
		const signedAmount = directionByFlow.get(flowId) === 'inflow' ? -tx.amount : tx.amount;
		actualByFlow.set(flowId, (actualByFlow.get(flowId) ?? 0) + signedAmount);
	}

	return {
		flows: (flows ?? []).map((f) => ({ ...f, actualThisMonth: actualByFlow.get(f.id) ?? 0 }))
	};
};

function parseTarget(raw: FormDataEntryValue | null): number | null {
	const str = String(raw ?? '').trim();
	if (!str) return null;
	const n = Number(str);
	return Number.isNaN(n) ? null : n;
}

export const actions: Actions = {
	create: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const direction = String(formData.get('direction') ?? 'outflow');
		const color = String(formData.get('color') ?? 'mist');
		const monthlyTarget = parseTarget(formData.get('monthly_target'));

		if (!name) return fail(400, { error: 'Name is required.' });

		const { data: maxRow } = await supabase
			.from('flows')
			.select('sort_order')
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '');

		const { error } = await supabase.from('flows').insert({
			user_id: user!.id,
			name,
			slug: slug || crypto.randomUUID(),
			direction: direction === 'inflow' ? 'inflow' : 'outflow',
			color: FLOW_COLOR_TOKENS.includes(color as never) ? color : 'mist',
			monthly_target: monthlyTarget,
			sort_order: (maxRow?.sort_order ?? -1) + 1
		});

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	update: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const name = String(formData.get('name') ?? '').trim();
		const direction = String(formData.get('direction') ?? 'outflow');
		const color = String(formData.get('color') ?? 'mist');
		const countsTowardTotals = formData.get('counts_toward_totals') === 'on';
		const monthlyTarget = parseTarget(formData.get('monthly_target'));

		if (!name) return fail(400, { error: 'Name is required.' });

		const { error } = await supabase
			.from('flows')
			.update({
				name,
				direction: direction === 'inflow' ? 'inflow' : 'outflow',
				color: FLOW_COLOR_TOKENS.includes(color as never) ? color : 'mist',
				counts_toward_totals: countsTowardTotals,
				monthly_target: monthlyTarget
			})
			.eq('id', id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	archive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabase.from('flows').update({ is_archived: true }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const direction = String(formData.get('direction') ?? '');

		const { data: flows } = await supabase
			.from('flows')
			.select('id, sort_order')
			.eq('is_archived', false)
			.order('sort_order');

		if (!flows) return fail(400, { error: 'Could not reorder.' });

		const index = flows.findIndex((f) => f.id === id);
		const swapIndex = direction === 'up' ? index - 1 : index + 1;
		if (index === -1 || swapIndex < 0 || swapIndex >= flows.length) {
			return { success: true };
		}

		const a = flows[index];
		const b = flows[swapIndex];

		await Promise.all([
			supabase.from('flows').update({ sort_order: b.sort_order }).eq('id', a.id),
			supabase.from('flows').update({ sort_order: a.sort_order }).eq('id', b.id)
		]);

		return { success: true };
	}
};
