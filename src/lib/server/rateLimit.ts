import { supabaseAdmin } from '$lib/server/supabaseAdmin';

// Fixed-window request throttle backed by the perfinia_check_rate_limit
// Postgres function (single atomic upsert, no read-then-write race).
// Fails open on unexpected DB errors — this guards against abuse, not a
// hard security boundary, so availability wins over blocking on a hiccup.
export async function checkRateLimit(
	key: string,
	limit: number,
	windowSeconds: number
): Promise<boolean> {
	const { data, error } = await supabaseAdmin.rpc('perfinia_check_rate_limit', {
		p_key: key,
		p_limit: limit,
		p_window_seconds: windowSeconds
	});

	if (error) {
		console.error('Rate limit check failed', error);
		return true;
	}

	return data;
}
