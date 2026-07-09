export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '13.0.5';
	};
	public: {
		Tables: {
			accounts: {
				Row: {
					archived_at: string | null;
					available_balance: number | null;
					created_at: string;
					credit_limit: number | null;
					current_balance: number | null;
					id: string;
					is_archived: boolean;
					is_asset: boolean;
					is_manual: boolean;
					iso_currency_code: string;
					mask: string | null;
					name: string;
					official_name: string | null;
					plaid_account_id: string | null;
					plaid_item_id: string | null;
					subtype: string | null;
					type: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					archived_at?: string | null;
					available_balance?: number | null;
					created_at?: string;
					credit_limit?: number | null;
					current_balance?: number | null;
					id?: string;
					is_archived?: boolean;
					is_asset?: boolean;
					is_manual?: boolean;
					iso_currency_code?: string;
					mask?: string | null;
					name: string;
					official_name?: string | null;
					plaid_account_id?: string | null;
					plaid_item_id?: string | null;
					subtype?: string | null;
					type: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					archived_at?: string | null;
					available_balance?: number | null;
					created_at?: string;
					credit_limit?: number | null;
					current_balance?: number | null;
					id?: string;
					is_archived?: boolean;
					is_asset?: boolean;
					is_manual?: boolean;
					iso_currency_code?: string;
					mask?: string | null;
					name?: string;
					official_name?: string | null;
					plaid_account_id?: string | null;
					plaid_item_id?: string | null;
					subtype?: string | null;
					type?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'accounts_plaid_item_id_fkey';
						columns: ['plaid_item_id'];
						isOneToOne: false;
						referencedRelation: 'plaid_items';
						referencedColumns: ['id'];
					}
				];
			};
			balance_snapshots: {
				Row: {
					account_id: string;
					as_of_date: string;
					available_balance: number | null;
					created_at: string;
					current_balance: number;
					id: string;
					source: string;
					user_id: string;
				};
				Insert: {
					account_id: string;
					as_of_date: string;
					available_balance?: number | null;
					created_at?: string;
					current_balance: number;
					id?: string;
					source: string;
					user_id: string;
				};
				Update: {
					account_id?: string;
					as_of_date?: string;
					available_balance?: number | null;
					created_at?: string;
					current_balance?: number;
					id?: string;
					source?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'balance_snapshots_account_id_fkey';
						columns: ['account_id'];
						isOneToOne: false;
						referencedRelation: 'accounts';
						referencedColumns: ['id'];
					}
				];
			};
			categories: {
				Row: {
					color: string | null;
					created_at: string;
					flow_id: string;
					icon: string | null;
					id: string;
					is_archived: boolean;
					is_supplemental_income: boolean;
					name: string;
					sort_order: number;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					color?: string | null;
					created_at?: string;
					flow_id: string;
					icon?: string | null;
					id?: string;
					is_archived?: boolean;
					is_supplemental_income?: boolean;
					name: string;
					sort_order?: number;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					color?: string | null;
					created_at?: string;
					flow_id?: string;
					icon?: string | null;
					id?: string;
					is_archived?: boolean;
					is_supplemental_income?: boolean;
					name?: string;
					sort_order?: number;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'categories_flow_id_fkey';
						columns: ['flow_id'];
						isOneToOne: false;
						referencedRelation: 'flows';
						referencedColumns: ['id'];
					}
				];
			};
			category_plaid_mappings: {
				Row: {
					category_id: string;
					created_at: string;
					id: string;
					plaid_detailed_category: string;
					user_id: string;
				};
				Insert: {
					category_id: string;
					created_at?: string;
					id?: string;
					plaid_detailed_category: string;
					user_id: string;
				};
				Update: {
					category_id?: string;
					created_at?: string;
					id?: string;
					plaid_detailed_category?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'category_plaid_mappings_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
			};
			flows: {
				Row: {
					color: string | null;
					counts_toward_totals: boolean;
					created_at: string;
					direction: string;
					icon: string | null;
					id: string;
					is_archived: boolean;
					monthly_target: number | null;
					name: string;
					slug: string;
					sort_order: number;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					color?: string | null;
					counts_toward_totals?: boolean;
					created_at?: string;
					direction: string;
					icon?: string | null;
					id?: string;
					is_archived?: boolean;
					monthly_target?: number | null;
					name: string;
					slug: string;
					sort_order?: number;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					color?: string | null;
					counts_toward_totals?: boolean;
					created_at?: string;
					direction?: string;
					icon?: string | null;
					id?: string;
					is_archived?: boolean;
					monthly_target?: number | null;
					name?: string;
					slug?: string;
					sort_order?: number;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			merchant_category_map: {
				Row: {
					category_id: string;
					created_at: string;
					id: string;
					match_count: number;
					merchant_key: string;
					source: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					category_id: string;
					created_at?: string;
					id?: string;
					match_count?: number;
					merchant_key: string;
					source?: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					category_id?: string;
					created_at?: string;
					id?: string;
					match_count?: number;
					merchant_key?: string;
					source?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'merchant_category_map_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
			};
			plaid_items: {
				Row: {
					access_token_ciphertext: string;
					access_token_iv: string;
					access_token_tag: string;
					created_at: string;
					cursor: string | null;
					error_code: string | null;
					error_message: string | null;
					id: string;
					institution_id: string | null;
					institution_name: string | null;
					last_synced_at: string | null;
					plaid_item_id: string;
					status: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					access_token_ciphertext: string;
					access_token_iv: string;
					access_token_tag: string;
					created_at?: string;
					cursor?: string | null;
					error_code?: string | null;
					error_message?: string | null;
					id?: string;
					institution_id?: string | null;
					institution_name?: string | null;
					last_synced_at?: string | null;
					plaid_item_id: string;
					status?: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					access_token_ciphertext?: string;
					access_token_iv?: string;
					access_token_tag?: string;
					created_at?: string;
					cursor?: string | null;
					error_code?: string | null;
					error_message?: string | null;
					id?: string;
					institution_id?: string | null;
					institution_name?: string | null;
					last_synced_at?: string | null;
					plaid_item_id?: string;
					status?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					created_at: string;
					default_shift_income_estimate: number | null;
					display_name: string | null;
					email: string | null;
					id: string;
				};
				Insert: {
					created_at?: string;
					default_shift_income_estimate?: number | null;
					display_name?: string | null;
					email?: string | null;
					id: string;
				};
				Update: {
					created_at?: string;
					default_shift_income_estimate?: number | null;
					display_name?: string | null;
					email?: string | null;
					id?: string;
				};
				Relationships: [];
			};
			transactions: {
				Row: {
					account_id: string;
					amount: number;
					authorized_date: string | null;
					category_id: string | null;
					category_source: string;
					created_at: string;
					date: string;
					id: string;
					is_supplemental_income_override: boolean | null;
					is_transfer: boolean;
					iso_currency_code: string;
					merchant_entity_id: string | null;
					merchant_name: string | null;
					name: string;
					notes: string | null;
					pending: boolean;
					plaid_category_detailed: string | null;
					plaid_category_primary: string | null;
					plaid_pending_transaction_id: string | null;
					plaid_raw: Json | null;
					plaid_transaction_id: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					account_id: string;
					amount: number;
					authorized_date?: string | null;
					category_id?: string | null;
					category_source?: string;
					created_at?: string;
					date: string;
					id?: string;
					is_supplemental_income_override?: boolean | null;
					is_transfer?: boolean;
					iso_currency_code?: string;
					merchant_entity_id?: string | null;
					merchant_name?: string | null;
					name: string;
					notes?: string | null;
					pending?: boolean;
					plaid_category_detailed?: string | null;
					plaid_category_primary?: string | null;
					plaid_pending_transaction_id?: string | null;
					plaid_raw?: Json | null;
					plaid_transaction_id?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					account_id?: string;
					amount?: number;
					authorized_date?: string | null;
					category_id?: string | null;
					category_source?: string;
					created_at?: string;
					date?: string;
					id?: string;
					is_supplemental_income_override?: boolean | null;
					is_transfer?: boolean;
					iso_currency_code?: string;
					merchant_entity_id?: string | null;
					merchant_name?: string | null;
					name?: string;
					notes?: string | null;
					pending?: boolean;
					plaid_category_detailed?: string | null;
					plaid_category_primary?: string | null;
					plaid_pending_transaction_id?: string | null;
					plaid_raw?: Json | null;
					plaid_transaction_id?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'transactions_account_id_fkey';
						columns: ['account_id'];
						isOneToOne: false;
						referencedRelation: 'accounts';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'transactions_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
			};
			webhook_events: {
				Row: {
					id: string;
					payload: Json;
					plaid_item_id: string | null;
					processed_at: string | null;
					received_at: string;
					status: string;
					webhook_code: string;
					webhook_type: string;
				};
				Insert: {
					id?: string;
					payload: Json;
					plaid_item_id?: string | null;
					processed_at?: string | null;
					received_at?: string;
					status?: string;
					webhook_code: string;
					webhook_type: string;
				};
				Update: {
					id?: string;
					payload?: Json;
					plaid_item_id?: string | null;
					processed_at?: string | null;
					received_at?: string;
					status?: string;
					webhook_code?: string;
					webhook_type?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'webhook_events_plaid_item_id_fkey';
						columns: ['plaid_item_id'];
						isOneToOne: false;
						referencedRelation: 'plaid_items';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals['public'];

export type Tables<TableName extends keyof DefaultSchema['Tables']> =
	DefaultSchema['Tables'][TableName]['Row'];
export type TablesInsert<TableName extends keyof DefaultSchema['Tables']> =
	DefaultSchema['Tables'][TableName]['Insert'];
export type TablesUpdate<TableName extends keyof DefaultSchema['Tables']> =
	DefaultSchema['Tables'][TableName]['Update'];
