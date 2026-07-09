import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { ensureUserSeeded } from '$lib/server/seedDefaults';

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
	sendCode: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { error: 'Enter your email.', step: 'email' });
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
