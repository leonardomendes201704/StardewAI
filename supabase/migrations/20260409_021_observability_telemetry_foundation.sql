create table if not exists public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  account_type public.account_type,
  session_id text not null check (char_length(trim(both from session_id)) between 8 and 80),
  event_name text not null check (char_length(trim(both from event_name)) between 3 and 80),
  pathname text,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  application_id uuid references public.opportunity_applications(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists telemetry_events_created_idx
  on public.telemetry_events (created_at desc);

create index if not exists telemetry_events_event_created_idx
  on public.telemetry_events (event_name, created_at desc);

create index if not exists telemetry_events_account_created_idx
  on public.telemetry_events (account_id, created_at desc);

create index if not exists telemetry_events_contract_created_idx
  on public.telemetry_events (contract_id, created_at desc)
  where contract_id is not null;

create index if not exists telemetry_events_opportunity_created_idx
  on public.telemetry_events (opportunity_id, created_at desc)
  where opportunity_id is not null;

alter table public.telemetry_events enable row level security;

drop policy if exists "telemetry_events_insert_authenticated" on public.telemetry_events;

create policy "telemetry_events_insert_authenticated"
on public.telemetry_events
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and account_id = (select auth.uid())
);

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  account_type public.account_type,
  session_id text,
  pathname text,
  source text not null check (char_length(trim(both from source)) between 2 and 80),
  severity text not null default 'error' check (severity in ('warning', 'error', 'fatal')),
  message text not null check (char_length(trim(both from message)) between 1 and 1000),
  stack text,
  fingerprint text,
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_error_events_created_idx
  on public.app_error_events (created_at desc);

create index if not exists app_error_events_source_created_idx
  on public.app_error_events (source, created_at desc);

create index if not exists app_error_events_account_created_idx
  on public.app_error_events (account_id, created_at desc);

alter table public.app_error_events enable row level security;

drop policy if exists "app_error_events_insert_authenticated" on public.app_error_events;

create policy "app_error_events_insert_authenticated"
on public.app_error_events
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and account_id = (select auth.uid())
);

create or replace view public.telemetry_daily_rollup as
select
  date_trunc('day', created_at)::date as day,
  coalesce(account_type::text, 'unknown') as account_type,
  event_name,
  count(*)::bigint as total
from public.telemetry_events
group by 1, 2, 3
order by 1 desc, 4 desc;

create or replace view public.telemetry_error_daily_rollup as
select
  date_trunc('day', created_at)::date as day,
  severity,
  source,
  count(*)::bigint as total
from public.app_error_events
group by 1, 2, 3
order by 1 desc, 4 desc;

create or replace view public.telemetry_funnel_snapshot as
select
  count(*) filter (where event_name = 'auth_sign_in_succeeded')::bigint as auth_sign_in_succeeded_total,
  count(*) filter (where event_name = 'profile_saved')::bigint as profile_saved_total,
  count(*) filter (where event_name = 'opportunity_published')::bigint as opportunity_published_total,
  count(*) filter (where event_name = 'opportunity_applied')::bigint as opportunity_applied_total,
  count(*) filter (where event_name = 'direct_invite_sent')::bigint as direct_invite_sent_total,
  count(*) filter (where event_name = 'contract_confirmed')::bigint as contract_confirmed_total,
  count(*) filter (where event_name = 'review_submitted')::bigint as review_submitted_total,
  count(*) filter (where event_name = 'chat_message_sent')::bigint as chat_message_sent_total
from public.telemetry_events;

revoke all on public.telemetry_daily_rollup from anon, authenticated;
revoke all on public.telemetry_error_daily_rollup from anon, authenticated;
revoke all on public.telemetry_funnel_snapshot from anon, authenticated;
