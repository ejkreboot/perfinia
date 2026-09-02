-- App-level request throttling: a small Postgres-backed fixed-window
-- counter, checked via a single atomic upsert (no read-then-write race).
-- Used to slow down OTP send/verify abuse and cap Plaid API call volume
-- from a single account, ahead of a proper edge/WAF-level rate limiter.
create table public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 1
);

alter table public.rate_limit_buckets enable row level security;
-- No client-facing policies: only callable via the service-role client.

create or replace function public.perfinia_check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limit_buckets (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set count = case
          when public.rate_limit_buckets.window_start <= v_now - make_interval(secs => p_window_seconds)
            then 1
          else public.rate_limit_buckets.count + 1
        end,
        window_start = case
          when public.rate_limit_buckets.window_start <= v_now - make_interval(secs => p_window_seconds)
            then v_now
          else public.rate_limit_buckets.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke execute on function public.perfinia_check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
