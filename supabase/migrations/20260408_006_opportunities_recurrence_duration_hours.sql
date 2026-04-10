alter table public.opportunities
  drop constraint if exists opportunities_duration_minutes_check;

update public.opportunities
set duration_minutes = greatest(1, ceil(duration_minutes / 60.0))::integer
where duration_minutes is not null;

alter table public.opportunities
  rename column duration_minutes to duration_hours;

alter table public.opportunities
  add column recurrence_days text[] not null default '{}'::text[];

alter table public.opportunities
  add constraint opportunities_duration_hours_check
  check (duration_hours > 0 and duration_hours <= 12);

alter table public.opportunities
  add constraint opportunities_recurrence_days_check
  check (recurrence_days <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
