import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [{ data: categories, error }, { data: flows }] = await Promise.all([
		supabase
			.from('categories')
			.select('id, name, flow_id, is_supplemental_income, sort_order, flows ( id, name, color, direction )')
			.eq('is_archived', false)
			.order('name'),
		supabase
			.from('flows')
			.select('id, name, color, direction')
			.eq('is_archived', false)
			.order('sort_order')
	]);

	if (error) throw error;

	return { categories: categories ?? [], flows: flows ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const flowId = String(formData.get('flow_id') ?? '');
		const isSupplementalIncome = formData.get('is_supplemental_income') === 'on';

		if (!name || !flowId) return fail(400, { error: 'Name and flow are required.' });

		const { error } = await supabase.from('categories').insert({
			user_id: user!.id,
			flow_id: flowId,
			name,
			is_supplemental_income: isSupplementalIncome
		});

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	update: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const name = String(formData.get('name') ?? '').trim();
		const flowId = String(formData.get('flow_id') ?? '');
		const isSupplementalIncome = formData.get('is_supplemental_income') === 'on';

		if (!name || !flowId) return fail(400, { error: 'Name and flow are required.' });

		const { error } = await supabase
			.from('categories')
			.update({ name, flow_id: flowId, is_supplemental_income: isSupplementalIncome })
			.eq('id', id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	archive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabase.from('categories').update({ is_archived: true }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	}
};
