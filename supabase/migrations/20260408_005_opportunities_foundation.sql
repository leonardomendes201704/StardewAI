create type public.opportunity_status as enum ('draft', 'open', 'closed', 'cancelled');

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venue_profiles(account_id) on delete cascade,
  title text not null,
  event_date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  music_genre text not null,
  artist_category text,
  budget_cents integer not null check (budget_cents >= 0),
  city text not null,
  state text not null,
  location_label text not null,
  structure_summary text,
  notes text,
  is_urgent boolean not null default false,
  status public.opportunity_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index opportunities_venue_status_date_idx
  on public.opportunities (venue_id, status, event_date, start_time);

create index opportunities_public_feed_idx
  on public.opportunities (status, event_date, city, state);

create or replace function public.set_opportunities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_opportunities_updated_at
before update on public.opportunities
for each row
execute function public.set_opportunities_updated_at();

alter table public.opportunities enable row level security;

create policy "opportunities_select_open_or_own"
on public.opportunities
for select
to authenticated
using (
  auth.uid() is not null
  and (
    status = 'open'
    or venue_id = auth.uid()
  )
);

create policy "opportunities_insert_own"
on public.opportunities
for insert
to authenticated
with check (
  auth.uid() is not null
  and venue_id = auth.uid()
);

create policy "opportunities_update_own"
on public.opportunities
for update
to authenticated
using (
  auth.uid() is not null
  and venue_id = auth.uid()
)
with check (
  auth.uid() is not null
  and venue_id = auth.uid()
);

create policy "opportunities_delete_own"
on public.opportunities
for delete
to authenticated
using (
  auth.uid() is not null
  and venue_id = auth.uid()
);
