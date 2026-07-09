import { json, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { merchantKey } from '$lib/server/plaid/categorize';

// Manual recategorization: sets this transaction to user_manual (never
// clobbered by a later sync), teaches merchant_category_map so future synced
// transactions from the same merchant auto-apply the correction, and
// optionally retroactively bulk-updates other already-imported transactions
// from the same merchant that haven't themselves been manually corrected.
export const PATCH: RequestHandler = async ({ params, request, locals: { user } }) => {
	if (!user) kitError(401, 'Not authenticated');

	const body = await request.json();
	const categoryId = body?.category_id as string | undefined;
	const applyToMerchant = body?.applyToMerchant !== false;

	if (!categoryId) kitError(400, 'Missing category_id');

	const { data: tx, error: txError } = await supabaseAdmin
		.from('transactions')
		.select('id, user_id, merchant_entity_id, merchant_name, name')
		.eq('id', params.id)
		.single();

	if (txError || !tx || tx.user_id !== user.id) kitError(404, 'Transaction not found');

	const { error: updateError } = await supabaseAdmin
		.from('transactions')
		.update({ category_id: categoryId, category_source: 'user_manual' })
		.eq('id', tx.id);
	if (updateError) kitError(500, updateError.message);

	const key = merchantKey(tx);

	const { data: existingMap } = await supabaseAdmin
		.from('merchant_category_map')
		.select('match_count')
		.eq('user_id', user.id)
		.eq('merchant_key', key)
		.maybeSingle();

	await supabaseAdmin.from('merchant_category_map').upsert(
		{
			user_id: user.id,
			merchant_key: key,
			category_id: categoryId,
			source: 'user_correction',
			match_count: (existingMap?.match_count ?? 0) + 1
		},
		{ onConflict: 'user_id,merchant_key' }
	);

	let updatedCount = 0;
	if (applyToMerchant) {
		let matchQuery = supabaseAdmin
			.from('transactions')
			.update({ category_id: categoryId, category_source: 'auto_merchant_learned' })
			.eq('user_id', user.id)
			.neq('id', tx.id)
			.neq('category_source', 'user_manual');

		if (tx.merchant_entity_id) {
			matchQuery = matchQuery.eq('merchant_entity_id', tx.merchant_entity_id);
		} else if (tx.merchant_name) {
			matchQuery = matchQuery.eq('merchant_name', tx.merchant_name);
		} else {
			matchQuery = matchQuery.eq('name', tx.name);
		}

		const { data: others, error: bulkError } = await matchQuery.select('id');
		if (!bulkError) updatedCount = others?.length ?? 0;
	}

	return json({ success: true, updatedCount });
};
