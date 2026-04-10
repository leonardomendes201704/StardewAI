create type public.stripe_connected_account_status as enum (
  'not_started',
  'onboarding_required',
  'pending_review',
  'ready',
  'restricted'
);

alter table public.account_payment_profiles
  add column stripe_connected_account_id text unique,
  add column stripe_connected_account_status public.stripe_connected_account_status not null default 'not_started',
  add column stripe_connect_country text,
  add column stripe_connect_dashboard text,
  add column stripe_transfers_capability_status text,
  add column stripe_payouts_capability_status text,
  add column stripe_requirements_due text[] not null default '{}'::text[],
  add column stripe_requirements_pending text[] not null default '{}'::text[],
  add column stripe_requirements_disabled_reason text,
  add column stripe_onboarding_completed_at timestamptz,
  add column stripe_last_connect_sync_at timestamptz,
  add column stripe_last_payout_attempt_at timestamptz;

create index account_payment_profiles_connected_account_idx
  on public.account_payment_profiles (stripe_connected_account_id)
  where stripe_connected_account_id is not null;
