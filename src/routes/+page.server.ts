import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	redirect(303, session ? '/dashboard' : '/login');
};
