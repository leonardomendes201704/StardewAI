create type public.opportunity_application_status as enum (
  'submitted',
  'shortlisted',
  'rejected',
  'accepted',
  'withdrawn'
);

create table public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(account_id) on delete cascade,
  status public.opportunity_application_status not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint opportunity_applications_unique_opportunity_artist unique (opportunity_id, artist_id)
);

create index opportunity_applications_artist_status_idx
  on public.opportunity_applications (artist_id, status, created_at desc);

create index opportunity_applications_opportunity_status_idx
  on public.opportunity_applications (opportunity_id, status, created_at desc);

create or replace function public.set_opportunity_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_opportunity_applications_updated_at
before update on public.opportunity_applications
for each row
execute function public.set_opportunity_applications_updated_at();

alter table public.opportunity_applications enable row level security;

create policy "opportunity_applications_select_own_or_venue"
on public.opportunity_applications
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    artist_id = (select auth.uid())
    or opportunity_id in (
      select id
      from public.opportunities
      where venue_id = (select auth.uid())
    )
  )
);

create policy "opportunity_applications_insert_own_open"
on public.opportunity_applications
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and artist_id = (select auth.uid())
  and exists (
    select 1
    from public.accounts
    where id = (select auth.uid())
      and account_type = 'musician'
  )
  and opportunity_id in (
    select id
    from public.opportunities
    where status = 'open'
      and venue_id <> (select auth.uid())
  )
);

drop policy if exists "opportunities_select_open_or_own" on public.opportunities;

create policy "opportunities_select_open_own_or_applied"
on public.opportunities
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    status = 'open'
    or venue_id = (select auth.uid())
    or id in (
      select opportunity_id
      from public.opportunity_applications
      where artist_id = (select auth.uid())
    )
  )
);
