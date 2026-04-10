create table if not exists public.artist_reviews (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(account_id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  author_venue_id uuid references public.venue_profiles(account_id) on delete set null,
  reviewer_name text not null check (char_length(trim(reviewer_name)) >= 2),
  reviewer_city text,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(trim(comment)) between 12 and 600),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists artist_reviews_artist_created_at_idx
  on public.artist_reviews (artist_id, created_at desc);

create unique index if not exists artist_reviews_real_author_once_per_opportunity_idx
  on public.artist_reviews (opportunity_id, author_venue_id)
  where opportunity_id is not null and author_venue_id is not null;

alter table public.artist_reviews enable row level security;

drop trigger if exists set_artist_reviews_updated_at on public.artist_reviews;
create trigger set_artist_reviews_updated_at
before update on public.artist_reviews
for each row execute function public.set_updated_at();

drop policy if exists "Authenticated users can read artist reviews" on public.artist_reviews;
create policy "Authenticated users can read artist reviews"
on public.artist_reviews
for select
to authenticated
using (true);

drop policy if exists "Bars can insert their own artist reviews" on public.artist_reviews;
create policy "Bars can insert their own artist reviews"
on public.artist_reviews
for insert
to authenticated
with check (
  author_venue_id = (select auth.uid())
);

drop policy if exists "Bars can update their own artist reviews" on public.artist_reviews;
create policy "Bars can update their own artist reviews"
on public.artist_reviews
for update
to authenticated
using (author_venue_id = (select auth.uid()))
with check (author_venue_id = (select auth.uid()));

drop policy if exists "Bars can delete their own artist reviews" on public.artist_reviews;
create policy "Bars can delete their own artist reviews"
on public.artist_reviews
for delete
to authenticated
using (author_venue_id = (select auth.uid()));

with target_artists as (
  select ap.account_id as artist_id
  from public.artist_profiles ap
),
seed_reviews as (
  select *
  from (
    values
      ('Quintal 79', 'Santos/SP', 5, 'Chegou no horario, segurou o publico ate o fim e foi muito facil alinhar repertorio.', 31),
      ('Mar de Dentro Bar', 'Sao Vicente/SP', 4, 'Boa presenca de palco, comunicacao simples e setup rapido para operar.', 22),
      ('Beco do Centro', 'Praia Grande/SP', 5, 'Profissional, educado com a equipe e entregou exatamente o clima prometido no perfil.', 13)
  ) as seed(reviewer_name, reviewer_city, rating, comment, days_ago)
)
insert into public.artist_reviews (
  artist_id,
  reviewer_name,
  reviewer_city,
  rating,
  comment,
  created_at,
  updated_at
)
select
  ta.artist_id,
  seed.reviewer_name,
  seed.reviewer_city,
  seed.rating,
  seed.comment,
  timezone('utc', now()) - make_interval(days => seed.days_ago),
  timezone('utc', now()) - make_interval(days => seed.days_ago)
from target_artists ta
cross join seed_reviews seed
where not exists (
  select 1
  from public.artist_reviews ar
  where ar.artist_id = ta.artist_id
    and ar.reviewer_name = seed.reviewer_name
    and ar.comment = seed.comment
);
