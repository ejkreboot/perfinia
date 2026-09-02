-- Nicknames let a user tell apart several accounts from the same institution
-- (two "Checking" rows under one bank read identically otherwise). Kept in its
-- own column rather than overwriting `name`, because Plaid re-upserts `name`
-- from the institution on every link/refresh and would clobber a user edit.

alter table public.accounts add column nickname text;

comment on column public.accounts.nickname is
  'User-supplied display name; falls back to `name` when null.';

-- Normalize blank input to null so the fallback stays a simple null check.
alter table public.accounts add constraint accounts_nickname_not_blank
  check (nickname is null or length(btrim(nickname)) > 0);
