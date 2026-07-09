-- Perfinia initial schema: accounts, flows, categories, transactions, Plaid
-- integration tables. All user-owned tables carry user_id and are RLS-scoped
-- to auth.uid(). This project's "public" schema is shared with a few other
-- small unrelated apps in the same Supabase project — table names below are
-- chosen to avoid collisions with existing tables (notebooks, cells,
-- flashcard_decks, flashcards, meeting_rooms, room_presence, budgets, albums,
-- roles, user_details, rooms, devices, weddings, suggestions).

-- ---------------------------------------------------------------------------
-- Helper: touch updated_at on row update
-- ---------------------------------------------------------------------------
create or replace function public.perfinia_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  default_shift_income_estimate numeric,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Seed a profile row automatically when a new auth user signs up.
-- Named perfinia_* to avoid colliding with other apps' triggers/functions of
-- the same generic name on this shared project's auth.users table.
create or replace function public.perfinia_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger perfinia_on_auth_user_created
  after insert on auth.users
  for each row execute function public.perfinia_handle_new_user();

-- ---------------------------------------------------------------------------
-- plaid_items — one per linked institution. Contains encrypted access
-- tokens; deliberately no client-facing RLS policies (service-role only).
-- ---------------------------------------------------------------------------
create table public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plaid_item_id text not null unique,
  institution_id text,
  institution_name text,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  access_token_tag text not null,
  cursor text,
  status text not null default 'active'
    check (status in ('active', 'error', 'pending_expiration', 'revoked')),
  error_code text,
  error_message text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plaid_items_user_id_idx on public.plaid_items (user_id);

alter table public.plaid_items enable row level security;

create trigger plaid_items_touch_updated_at
  before update on public.plaid_items
  for each row execute function public.perfinia_touch_updated_at();

-- ---------------------------------------------------------------------------
-- accounts — Plaid-linked (plaid_item_id set) or manual (is_manual = true)
-- ---------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plaid_item_id uuid references public.plaid_items (id) on delete cascade,
  plaid_account_id text unique,
  name text not null,
  official_name text,
  type text not null,
  subtype text,
  mask text,
  is_manual boolean not null default false,
  is_asset boolean not null default true,
  current_balance numeric,
  available_balance numeric,
  credit_limit numeric,
  iso_currency_code text not null default 'USD',
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "accounts: select own" on public.accounts
  for select using (user_id = auth.uid());
create policy "accounts: insert own" on public.accounts
  for insert with check (user_id = auth.uid());
create policy "accounts: update own" on public.accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accounts: delete own" on public.accounts
  for delete using (user_id = auth.uid());

create trigger accounts_touch_updated_at
  before update on public.accounts
  for each row execute function public.perfinia_touch_updated_at();

-- ---------------------------------------------------------------------------
-- balance_snapshots — net-worth-over-time source of truth
-- ---------------------------------------------------------------------------
create table public.balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  as_of_date date not null,
  current_balance numeric not null,
  available_balance numeric,
  source text not null check (source in ('plaid_initial', 'plaid_sync', 'manual_entry')),
  created_at timestamptz not null default now(),
  unique (account_id, as_of_date)
);

create index balance_snapshots_account_date_idx on public.balance_snapshots (account_id, as_of_date);

alter table public.balance_snapshots enable row level security;

create policy "balance_snapshots: select own" on public.balance_snapshots
  for select using (user_id = auth.uid());
create policy "balance_snapshots: insert own" on public.balance_snapshots
  for insert with check (user_id = auth.uid());
create policy "balance_snapshots: update own" on public.balance_snapshots
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "balance_snapshots: delete own" on public.balance_snapshots
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- flows — user-manageable, not an enum
-- ---------------------------------------------------------------------------
create table public.flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  direction text not null check (direction in ('inflow', 'outflow')),
  counts_toward_totals boolean not null default true,
  monthly_target numeric,
  color text,
  icon text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index flows_user_id_idx on public.flows (user_id);

alter table public.flows enable row level security;

create policy "flows: select own" on public.flows
  for select using (user_id = auth.uid());
create policy "flows: insert own" on public.flows
  for insert with check (user_id = auth.uid());
create policy "flows: update own" on public.flows
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "flows: delete own" on public.flows
  for delete using (user_id = auth.uid());

create trigger flows_touch_updated_at
  before update on public.flows
  for each row execute function public.perfinia_touch_updated_at();

-- ---------------------------------------------------------------------------
-- categories — every category maps to exactly one flow
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flow_id uuid not null references public.flows (id) on delete restrict,
  name text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  is_supplemental_income boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_user_id_idx on public.categories (user_id);
create index categories_flow_id_idx on public.categories (flow_id);

alter table public.categories enable row level security;

create policy "categories: select own" on public.categories
  for select using (user_id = auth.uid());
create policy "categories: insert own" on public.categories
  for insert with check (user_id = auth.uid());
create policy "categories: update own" on public.categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories: delete own" on public.categories
  for delete using (user_id = auth.uid());

create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.perfinia_touch_updated_at();

-- ---------------------------------------------------------------------------
-- category_plaid_mappings — seeds auto-categorization from Plaid's PFC taxonomy
-- ---------------------------------------------------------------------------
create table public.category_plaid_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  plaid_detailed_category text not null,
  created_at timestamptz not null default now(),
  unique (user_id, plaid_detailed_category)
);

create index category_plaid_mappings_user_id_idx on public.category_plaid_mappings (user_id);

alter table public.category_plaid_mappings enable row level security;

create policy "category_plaid_mappings: select own" on public.category_plaid_mappings
  for select using (user_id = auth.uid());
create policy "category_plaid_mappings: insert own" on public.category_plaid_mappings
  for insert with check (user_id = auth.uid());
create policy "category_plaid_mappings: update own" on public.category_plaid_mappings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "category_plaid_mappings: delete own" on public.category_plaid_mappings
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- merchant_category_map — the "learns over time" mechanism
-- ---------------------------------------------------------------------------
create table public.merchant_category_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant_key text not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  match_count integer not null default 1,
  source text not null default 'user_correction',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, merchant_key)
);

create index merchant_category_map_user_id_idx on public.merchant_category_map (user_id);

alter table public.merchant_category_map enable row level security;

create policy "merchant_category_map: select own" on public.merchant_category_map
  for select using (user_id = auth.uid());
create policy "merchant_category_map: insert own" on public.merchant_category_map
  for insert with check (user_id = auth.uid());
create policy "merchant_category_map: update own" on public.merchant_category_map
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "merchant_category_map: delete own" on public.merchant_category_map
  for delete using (user_id = auth.uid());

create trigger merchant_category_map_touch_updated_at
  before update on public.merchant_category_map
  for each row execute function public.perfinia_touch_updated_at();

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  plaid_transaction_id text unique,
  plaid_pending_transaction_id text,
  pending boolean not null default false,
  amount numeric not null,
  iso_currency_code text not null default 'USD',
  date date not null,
  authorized_date date,
  name text not null,
  merchant_name text,
  merchant_entity_id text,
  plaid_category_primary text,
  plaid_category_detailed text,
  plaid_raw jsonb,
  category_id uuid references public.categories (id) on delete set null,
  category_source text not null default 'uncategorized'
    check (category_source in ('auto_seed', 'auto_merchant_learned', 'user_manual', 'uncategorized')),
  is_transfer boolean not null default false,
  is_supplemental_income_override boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_merchant_entity_id_idx on public.transactions (merchant_entity_id);

alter table public.transactions enable row level security;

create policy "transactions: select own" on public.transactions
  for select using (user_id = auth.uid());
create policy "transactions: insert own" on public.transactions
  for insert with check (user_id = auth.uid());
create policy "transactions: update own" on public.transactions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions: delete own" on public.transactions
  for delete using (user_id = auth.uid());

create trigger transactions_touch_updated_at
  before update on public.transactions
  for each row execute function public.perfinia_touch_updated_at();

-- ---------------------------------------------------------------------------
-- webhook_events — audit log + idempotency guard, service-role only
-- ---------------------------------------------------------------------------
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  plaid_item_id uuid references public.plaid_items (id) on delete set null,
  webhook_type text not null,
  webhook_code text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received' check (status in ('received', 'processed', 'error'))
);

alter table public.webhook_events enable row level security;
-- No client-facing policies: only the service-role key (used by the webhook
-- handler) can read/write this table.
