create table if not exists public.account_notification_preferences (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  push_enabled boolean not null default true,
  notify_new_application boolean not null default true,
  notify_direct_invite boolean not null default true,
  notify_chat_message boolean not null default true,
  notify_contract_update boolean not null default true,
  notify_payment_update boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.account_push_registrations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  installation_id text not null unique
    check (char_length(trim(both from installation_id)) between 8 and 120),
  expo_push_token text
    check (
      expo_push_token is null
      or char_length(trim(both from expo_push_token)) between 8 and 255
    ),
  platform text not null check (platform in ('android', 'ios', 'web')),
  permission_status text not null default 'undetermined'
    check (permission_status in ('granted', 'denied', 'undetermined')),
  device_name text,
  app_build text,
  disabled_at timestamptz,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists account_push_registrations_token_uidx
  on public.account_push_registrations (expo_push_token)
  where expo_push_token is not null;

create index if not exists account_push_registrations_account_idx
  on public.account_push_registrations (account_id, last_seen_at desc);

create table if not exists public.push_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  recipient_account_id uuid not null references public.accounts(id) on delete cascade,
  registration_id uuid references public.account_push_registrations(id) on delete set null,
  event_type text not null check (char_length(trim(both from event_type)) between 3 and 80),
  title text not null check (char_length(trim(both from title)) between 1 and 120),
  body text not null check (char_length(trim(both from body)) between 1 and 400),
  route text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null check (status in ('queued', 'sent', 'error', 'skipped')),
  provider_ticket_id text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz
);

create index if not exists push_notification_deliveries_recipient_idx
  on public.push_notification_deliveries (recipient_account_id, created_at desc);

create index if not exists push_notification_deliveries_event_idx
  on public.push_notification_deliveries (event_type, created_at desc);

create or replace function public.set_account_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_account_push_registrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_account_notification_preferences_updated_at on public.account_notification_preferences;

create trigger set_account_notification_preferences_updated_at
before update on public.account_notification_preferences
for each row
execute function public.set_account_notification_preferences_updated_at();

drop trigger if exists set_account_push_registrations_updated_at on public.account_push_registrations;

create trigger set_account_push_registrations_updated_at
before update on public.account_push_registrations
for each row
execute function public.set_account_push_registrations_updated_at();

alter table public.account_notification_preferences enable row level security;
alter table public.account_push_registrations enable row level security;
alter table public.push_notification_deliveries enable row level security;

drop policy if exists "account_notification_preferences_select_own" on public.account_notification_preferences;
drop policy if exists "account_notification_preferences_insert_own" on public.account_notification_preferences;
drop policy if exists "account_notification_preferences_update_own" on public.account_notification_preferences;
drop policy if exists "account_push_registrations_select_own" on public.account_push_registrations;
drop policy if exists "push_notification_deliveries_select_own" on public.push_notification_deliveries;

create policy "account_notification_preferences_select_own"
on public.account_notification_preferences
for select
to authenticated
using ((select auth.uid()) = account_id);

create policy "account_notification_preferences_insert_own"
on public.account_notification_preferences
for insert
to authenticated
with check ((select auth.uid()) = account_id);

create policy "account_notification_preferences_update_own"
on public.account_notification_preferences
for update
to authenticated
using ((select auth.uid()) = account_id)
with check ((select auth.uid()) = account_id);

create policy "account_push_registrations_select_own"
on public.account_push_registrations
for select
to authenticated
using ((select auth.uid()) = account_id);

create policy "push_notification_deliveries_select_own"
on public.push_notification_deliveries
for select
to authenticated
using ((select auth.uid()) = recipient_account_id);

grant select, insert, update on public.account_notification_preferences to authenticated;
grant select on public.account_push_registrations to authenticated;
grant select on public.push_notification_deliveries to authenticated;

create or replace function public.upsert_account_push_registration(
  p_installation_id text,
  p_expo_push_token text,
  p_platform text,
  p_permission_status text,
  p_device_name text default null,
  p_app_build text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid := auth.uid();
  v_registration_id uuid;
begin
  if v_account_id is null then
    raise exception 'auth required';
  end if;

  if p_platform not in ('android', 'ios', 'web') then
    raise exception 'invalid push platform';
  end if;

  if p_permission_status not in ('granted', 'denied', 'undetermined') then
    raise exception 'invalid push permission status';
  end if;

  insert into public.account_push_registrations (
    account_id,
    installation_id,
    expo_push_token,
    platform,
    permission_status,
    device_name,
    app_build,
    disabled_at,
    last_seen_at
  )
  values (
    v_account_id,
    trim(both from p_installation_id),
    nullif(trim(both from p_expo_push_token), ''),
    p_platform,
    p_permission_status,
    nullif(trim(both from p_device_name), ''),
    nullif(trim(both from p_app_build), ''),
    null,
    timezone('utc', now())
  )
  on conflict (installation_id) do update
  set
    account_id = excluded.account_id,
    expo_push_token = excluded.expo_push_token,
    platform = excluded.platform,
    permission_status = excluded.permission_status,
    device_name = excluded.device_name,
    app_build = excluded.app_build,
    disabled_at = case
      when excluded.permission_status = 'granted' then null
      else timezone('utc', now())
    end,
    last_seen_at = timezone('utc', now())
  returning id into v_registration_id;

  insert into public.account_notification_preferences (account_id)
  values (v_account_id)
  on conflict (account_id) do nothing;

  return v_registration_id;
end;
$$;

revoke all on function public.upsert_account_push_registration(text, text, text, text, text, text)
  from public;
grant execute on function public.upsert_account_push_registration(text, text, text, text, text, text)
  to authenticated;
