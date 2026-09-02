-- Drop the "extra shift" income estimate: not a generalizable personal
-- finance concept, remove from schema and any dependent UI/logic.
alter table public.profiles drop column if exists default_shift_income_estimate;
