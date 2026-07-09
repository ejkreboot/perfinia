-- Security hardening from the Supabase advisor pass:
-- 1. perfinia_touch_updated_at had no search_path pinned at all.
-- 2. perfinia_handle_new_user pinned search_path to 'public', which is safer
--    than nothing but still resolvable if another app sharing this project's
--    public schema ever created a colliding name — empty search_path plus
--    fully-qualified references removes that risk entirely.
-- 3. Both are SECURITY DEFINER trigger functions with no business being
--    directly callable via PostgREST RPC by anon/authenticated — only the
--    trigger mechanism itself should invoke them.

create or replace function public.perfinia_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.perfinia_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.perfinia_touch_updated_at() from public, anon, authenticated;
revoke execute on function public.perfinia_handle_new_user() from public, anon, authenticated;
