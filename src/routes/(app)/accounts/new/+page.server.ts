import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { ACCOUNT_TYPE_OPTIONS } from '$lib/accountTypes';

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const optionKey = String(formData.get('option') ?? '');
		const balanceRaw = String(formData.get('balance') ?? '');
		const balance = Number(balanceRaw);

		const option = ACCOUNT_TYPE_OPTIONS.find((o) => `${o.type}:${o.subtype}` === optionKey);

		if (!name || !option || Number.isNaN(balance)) {
			return fail(400, {
				error: 'Please fill in every field with a valid value.',
				name,
				optionKey,
				balanceRaw
			});
		}

		const { data: account, error: accountError } = await supabase
			.from('accounts')
			.insert({
				user_id: user!.id,
				name,
				type: option.type,
				subtype: option.subtype,
				is_manual: true,
				is_asset: option.isAsset,
				current_balance: balance,
				iso_currency_code: 'USD'
			})
			.select('id')
			.single();

		if (accountError) {
			return fail(400, { error: accountError.message, name, optionKey, balanceRaw });
		}

		const { error: snapshotError } = await supabase.from('balance_snapshots').insert({
			account_id: account.id,
			user_id: user!.id,
			as_of_date: new Date().toISOString().slice(0, 10),
			current_balance: balance,
			source: 'manual_entry'
		});

		if (snapshotError) {
			return fail(400, { error: snapshotError.message, name, optionKey, balanceRaw });
		}

		redirect(303, '/accounts');
	}
};
