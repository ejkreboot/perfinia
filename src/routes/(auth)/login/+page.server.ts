import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { ensureUserSeeded } from '$lib/server/seedDefaults';
import { checkRateLimit } from '$lib/server/rateLimit';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) redirect(303, '/dashboard');
};

// Email one-time-code login — no password at all. This project's
// auth.users is shared across several apps (see supabase/migrations
// comments), so a password set up by a different app could otherwise
// silently block sign-in here; a fresh emailed code sidesteps that
// entirely. signInWithOtp both sends the code and creates the user on
// first login (shouldCreateUser), so there's no separate signup step.
export const actions: Actions = {
	sendCode: async ({ request, locals: { supabase }, getClientAddress }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { error: 'Enter your email.', step: 'email' });
		}

		const emailOk = await checkRateLimit(`login_send:${email.toLowerCase()}`, 5, 15 * 60);
		const ipOk = await checkRateLimit(`login_send_ip:${getClientAddress()}`, 20, 60 * 60);
		if (!emailOk || !ipOk) {
			return fail(429, { error: 'Too many attempts. Try again in a few minutes.', step: 'email' });
		}

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { shouldCreateUser: true }
		});
		if (error) {
			return fail(400, { error: error.message, email, step: 'email' });
		}

		return { step: 'code', email };
	},

	verifyCode: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const code = String(formData.get('code') ?? '').trim();

		if (!email || !code) {
			return fail(400, { error: 'Enter the code from your email.', email, step: 'code' });
		}

		const verifyOk = await checkRateLimit(`login_verify:${email.toLowerCase()}`, 10, 15 * 60);
		if (!verifyOk) {
			return fail(429, {
				error: 'Too many attempts. Request a new code and try again shortly.',
				email,
				step: 'code'
			});
		}

		const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
		if (error) {
			return fail(400, { error: error.message, email, step: 'code' });
		}

		if (data.user) {
			await ensureUserSeeded(supabaseAdmin, data.user.id);
		}

		redirect(303, '/dashboard');
	}
};
