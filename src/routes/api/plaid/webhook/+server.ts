import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlaidWebhook } from '$lib/server/plaid/webhookVerify';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { syncItem } from '$lib/server/plaid/sync';

type ItemWebhookPayload = {
	error?: { error_code?: string; error_message?: string } | null;
};

async function handleItemWebhook(
	itemRowId: string,
	webhookCode: string,
	payload: ItemWebhookPayload
): Promise<void> {
	switch (webhookCode) {
		case 'ERROR':
			await supabaseAdmin
				.from('plaid_items')
				.update({
					status: 'error',
					error_code: payload.error?.error_code ?? null,
					error_message: payload.error?.error_message ?? null
				})
				.eq('id', itemRowId);
			break;
		case 'PENDING_EXPIRATION':
		case 'PENDING_DISCONNECT':
			await supabaseAdmin
				.from('plaid_items')
				.update({ status: 'pending_expiration' })
				.eq('id', itemRowId);
			break;
		case 'USER_PERMISSION_REVOKED':
			await supabaseAdmin.from('plaid_items').update({ status: 'revoked' }).eq('id', itemRowId);
			break;
		// NEW_ACCOUNTS_AVAILABLE: no local state change; a "reconnect to add
		// accounts" prompt is a future UI nicety, not required for correctness.
	}
}

// Plaid webhooks are unauthenticated by session (no cookies) — trust is
// established entirely by verifying the Plaid-Verification JWT below.
export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const verificationHeader = request.headers.get('plaid-verification');

	const verified = await verifyPlaidWebhook(rawBody, verificationHeader);
	if (!verified) {
		return json({ error: 'Invalid webhook signature' }, { status: 401 });
	}

	const payload = JSON.parse(rawBody);
	const { webhook_type: webhookType, webhook_code: webhookCode, item_id: plaidItemId } = payload;

	const { data: item } = await supabaseAdmin
		.from('plaid_items')
		.select('id')
		.eq('plaid_item_id', plaidItemId)
		.maybeSingle();

	// Log first for idempotency/observability — Plaid delivers webhooks
	// at-least-once, so redelivery of an already-processed event is expected.
	const { data: eventRow } = await supabaseAdmin
		.from('webhook_events')
		.insert({
			plaid_item_id: item?.id ?? null,
			webhook_type: webhookType,
			webhook_code: webhookCode,
			payload
		})
		.select('id')
		.single();

	try {
		if (item) {
			if (webhookType === 'TRANSACTIONS' && webhookCode === 'SYNC_UPDATES_AVAILABLE') {
				await syncItem(item.id);
			} else if (webhookType === 'ITEM') {
				await handleItemWebhook(item.id, webhookCode, payload);
			}
		}

		if (eventRow) {
			await supabaseAdmin
				.from('webhook_events')
				.update({ status: 'processed', processed_at: new Date().toISOString() })
				.eq('id', eventRow.id);
		}
	} catch {
		if (eventRow) {
			await supabaseAdmin.from('webhook_events').update({ status: 'error' }).eq('id', eventRow.id);
		}
	}

	return json({ success: true });
};
