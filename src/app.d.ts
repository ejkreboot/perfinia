import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		// Loaded at runtime from https://cdn.plaid.com/link/v2/stable/link-initialize.js
		Plaid: {
			create(config: {
				token: string;
				onSuccess: (publicToken: string, metadata: unknown) => void;
				onExit?: (err: unknown, metadata: unknown) => void;
			}): { open: () => void };
		};
	}
}

export {};
