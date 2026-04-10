create type public.contract_payment_charge_kind as enum (
  'single_event',
  'deposit',
  'balance'
);

create type public.contract_payment_occurrence_status as enum (
  'draft',
  'checkout_open',
  'payment_pending',
  'funds_held',
  'transfer_pending',
  'transferred',
  'transfer_reversed',
  'checkout_expired',
  'failed',
  'refunded',
  'cancelled'
);

create table public.account_payment_profiles (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  stripe_customer_id text unique,
  billing_email text,
  default_payment_method_id text,
  last_checkout_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.contract_payment_occurrences (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  venue_id uuid not null references public.venue_profiles(account_id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(account_id) on delete cascade,
  occurrence_date date not null,
  charge_kind public.contract_payment_charge_kind not null default 'single_event',
  status public.contract_payment_occurrence_status not null default 'draft',
  currency text not null default 'brl',
  amount_cents integer not null check (amount_cents > 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  musician_payout_cents integer not null default 0 check (musician_payout_cents >= 0),
  due_at timestamptz,
  checkout_expires_at timestamptz,
  release_after timestamptz,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  stripe_transfer_id text unique,
  paid_at timestamptz,
  transferred_at timestamptz,
  refunded_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contract_payment_occurrences_unique_charge unique (contract_id, occurrence_date, charge_kind),
  constraint contract_payment_occurrences_split_check
    check (platform_fee_cents + musician_payout_cents = amount_cents)
);

create index account_payment_profiles_customer_idx
  on public.account_payment_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index contract_payment_occurrences_contract_status_idx
  on public.contract_payment_occurrences (contract_id, status, occurrence_date desc);

create index contract_payment_occurrences_venue_status_idx
  on public.contract_payment_occurrences (venue_id, status, occurrence_date desc);

create index contract_payment_occurrences_artist_status_idx
  on public.contract_payment_occurrences (artist_id, status, occurrence_date desc);

create index contract_payment_occurrences_session_idx
  on public.contract_payment_occurrences (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index contract_payment_occurrences_payment_intent_idx
  on public.contract_payment_occurrences (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create or replace function public.set_account_payment_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_contract_payment_occurrences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_account_payment_profiles_updated_at
before update on public.account_payment_profiles
for each row
execute function public.set_account_payment_profiles_updated_at();

create trigger set_contract_payment_occurrences_updated_at
before update on public.contract_payment_occurrences
for each row
execute function public.set_contract_payment_occurrences_updated_at();

alter table public.account_payment_profiles enable row level security;
alter table public.contract_payment_occurrences enable row level security;

create policy "account_payment_profiles_select_own"
on public.account_payment_profiles
for select
to authenticated
using ((select auth.uid()) = account_id);

create policy "contract_payment_occurrences_select_participants"
on public.contract_payment_occurrences
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    venue_id = (select auth.uid())
    or artist_id = (select auth.uid())
  )
);
