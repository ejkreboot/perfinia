import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Signed-in visitors go straight to the app; everyone else gets the landing page.
export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) redirect(303, '/dashboard');
};
