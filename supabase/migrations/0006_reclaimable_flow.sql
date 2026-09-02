-- Adds the "Reclaimable" flow — spending that could be eliminated outright
-- rather than merely trimmed — to every already-seeded user, matching the new
-- DEFAULT_FLOWS entry in categorySeed.ts that covers users seeded from here on.
--
-- Subscriptions moves out of Discretionary & Goals into it. Transactions
-- reference categories rather than flows, so re-pointing the category
-- re-buckets a user's whole history in one step.

-- Reclaimable sorts at 3, between Discretionary & Goals and Savings &
-- Investing. Shift the flows below it down, highest first so no two rows
-- collide mid-update. Guarded on the seeded value so a user who has already
-- reordered their own flows keeps their arrangement.
update public.flows set sort_order = 6 where slug = 'transfers' and sort_order = 5;
update public.flows set sort_order = 5 where slug = 'debt_paydown' and sort_order = 4;
update public.flows set sort_order = 4 where slug = 'savings_investing' and sort_order = 3;

-- One Reclaimable flow per user who has been seeded (users with no flows at
-- all get the full set from ensureUserSeeded on their next login instead).
insert into public.flows (user_id, name, slug, direction, counts_toward_totals, sort_order, color)
select distinct f.user_id, 'Reclaimable', 'reclaimable', 'outflow', true, 3, 'iris'
from public.flows f
on conflict (user_id, slug) do nothing;

-- Re-point Subscriptions. Categories carry no slug, so match on the seeded
-- name, and only where it still sits in the flow the seed put it in — a
-- category the user has already moved or renamed is left alone.
update public.categories c
set flow_id = r.id
from public.flows r, public.flows d
where r.user_id = c.user_id
  and r.slug = 'reclaimable'
  and d.id = c.flow_id
  and d.slug = 'discretionary_goals'
  and c.name = 'Subscriptions';
