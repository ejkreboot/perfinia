import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { ensureUserSeeded } from '$lib/server/seedDefaults';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) redirect(303, '/dashboard');
};

function readCredentials(formData: FormData) {
	const email = String(formData.get('email') ?? '').trim();
	const password = String(formData.get('password') ?? '');
	return { email, password };
}

export const actions: Actions = {
	signin: async ({ request, locals: { supabase } }) => {
		const { email, password } = readCredentials(await request.formData());

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email, mode: 'signin' });
		}

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			return fail(400, { error: error.message, email, mode: 'signin' });
		}

		if (data.user) {
			await ensureUserSeeded(supabaseAdmin, data.user.id);
		}

		redirect(303, '/dashboard');
	},

	// Perfinia is a single-user app you're setting up for yourself, so account
	// creation provisions the user directly via the admin API (email_confirm:
	// true) rather than routing through Supabase's email-confirmation flow —
	// no mail delivery/redirect-URL configuration required to get started.
	signup: async ({ request, locals: { supabase } }) => {
		const { email, password } = readCredentials(await request.formData());

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email, mode: 'signup' });
		}
		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters.',
				email,
				mode: 'signup'
			});
		}

		const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});
		if (createError) {
			return fail(400, { error: createError.message, email, mode: 'signup' });
		}

		const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
		if (signInError) {
			return fail(400, { error: signInError.message, email, mode: 'signup' });
		}

		if (created.user) {
			await ensureUserSeeded(supabaseAdmin, created.user.id);
		}

		redirect(303, '/dashboard');
	}
};
