create schema if not exists private;

create or replace function public.calculate_composite_review_rating(
  punctuality_score integer,
  quality_score integer,
  professionalism_score integer
)
returns integer
language sql
immutable
as $$
  select greatest(
    1,
    least(
      5,
      round(((punctuality_score + quality_score + professionalism_score)::numeric / 3.0))
    )::integer
  );
$$;

alter table public.venue_reviews
  add column if not exists punctuality_rating integer,
  add column if not exists quality_rating integer,
  add column if not exists professionalism_rating integer;

alter table public.artist_reviews
  add column if not exists punctuality_rating integer,
  add column if not exists quality_rating integer,
  add column if not exists professionalism_rating integer;

update public.venue_reviews
set
  punctuality_rating = coalesce(punctuality_rating, rating),
  quality_rating = coalesce(quality_rating, rating),
  professionalism_rating = coalesce(professionalism_rating, rating)
where
  punctuality_rating is null
  or quality_rating is null
  or professionalism_rating is null;

update public.artist_reviews
set
  punctuality_rating = coalesce(punctuality_rating, rating),
  quality_rating = coalesce(quality_rating, rating),
  professionalism_rating = coalesce(professionalism_rating, rating)
where
  punctuality_rating is null
  or quality_rating is null
  or professionalism_rating is null;

alter table public.venue_reviews
  alter column punctuality_rating set not null,
  alter column quality_rating set not null,
  alter column professionalism_rating set not null;

alter table public.artist_reviews
  alter column punctuality_rating set not null,
  alter column quality_rating set not null,
  alter column professionalism_rating set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_reviews_punctuality_rating_check'
  ) then
    alter table public.venue_reviews
      add constraint venue_reviews_punctuality_rating_check
      check (punctuality_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_reviews_quality_rating_check'
  ) then
    alter table public.venue_reviews
      add constraint venue_reviews_quality_rating_check
      check (quality_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_reviews_professionalism_rating_check'
  ) then
    alter table public.venue_reviews
      add constraint venue_reviews_professionalism_rating_check
      check (professionalism_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_reviews_punctuality_rating_check'
  ) then
    alter table public.artist_reviews
      add constraint artist_reviews_punctuality_rating_check
      check (punctuality_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_reviews_quality_rating_check'
  ) then
    alter table public.artist_reviews
      add constraint artist_reviews_quality_rating_check
      check (quality_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_reviews_professionalism_rating_check'
  ) then
    alter table public.artist_reviews
      add constraint artist_reviews_professionalism_rating_check
      check (professionalism_rating between 1 and 5);
  end if;
end $$;

create or replace function public.sync_composite_review_rating()
returns trigger
language plpgsql
as $$
begin
  new.rating := public.calculate_composite_review_rating(
    new.punctuality_rating,
    new.quality_rating,
    new.professionalism_rating
  );

  return new;
end;
$$;

drop trigger if exists sync_venue_review_rating on public.venue_reviews;
create trigger sync_venue_review_rating
before insert or update on public.venue_reviews
for each row execute function public.sync_composite_review_rating();

drop trigger if exists sync_artist_review_rating on public.artist_reviews;
create trigger sync_artist_review_rating
before insert or update on public.artist_reviews
for each row execute function public.sync_composite_review_rating();

create or replace function private.can_artist_review_completed_contract(
  target_artist_id uuid,
  target_venue_id uuid,
  target_opportunity_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.contracts c
    where c.artist_id = target_artist_id
      and c.venue_id = target_venue_id
      and c.opportunity_id = target_opportunity_id
      and c.status = 'completed'
  );
$$;

create or replace function private.can_venue_review_completed_contract(
  target_venue_id uuid,
  target_artist_id uuid,
  target_opportunity_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.contracts c
    where c.venue_id = target_venue_id
      and c.artist_id = target_artist_id
      and c.opportunity_id = target_opportunity_id
      and c.status = 'completed'
  );
$$;

drop policy if exists "Artists can insert their own venue reviews" on public.venue_reviews;
create policy "Artists can insert their own venue reviews"
on public.venue_reviews
for insert
to authenticated
with check (
  author_artist_id = (select auth.uid())
  and private.can_artist_review_completed_contract(author_artist_id, venue_id, opportunity_id)
);

drop policy if exists "Artists can update their own venue reviews" on public.venue_reviews;
create policy "Artists can update their own venue reviews"
on public.venue_reviews
for update
to authenticated
using (author_artist_id = (select auth.uid()))
with check (
  author_artist_id = (select auth.uid())
  and private.can_artist_review_completed_contract(author_artist_id, venue_id, opportunity_id)
);

drop policy if exists "Bars can insert their own artist reviews" on public.artist_reviews;
create policy "Bars can insert their own artist reviews"
on public.artist_reviews
for insert
to authenticated
with check (
  author_venue_id = (select auth.uid())
  and private.can_venue_review_completed_contract(author_venue_id, artist_id, opportunity_id)
);

drop policy if exists "Bars can update their own artist reviews" on public.artist_reviews;
create policy "Bars can update their own artist reviews"
on public.artist_reviews
for update
to authenticated
using (author_venue_id = (select auth.uid()))
with check (
  author_venue_id = (select auth.uid())
  and private.can_venue_review_completed_contract(author_venue_id, artist_id, opportunity_id)
);
