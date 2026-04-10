create table if not exists public.venue_reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venue_profiles(account_id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  author_artist_id uuid references public.artist_profiles(account_id) on delete set null,
  reviewer_name text not null check (char_length(trim(reviewer_name)) >= 2),
  reviewer_city text,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(trim(comment)) between 12 and 600),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists venue_reviews_venue_created_at_idx
  on public.venue_reviews (venue_id, created_at desc);

create unique index if not exists venue_reviews_real_author_once_per_opportunity_idx
  on public.venue_reviews (opportunity_id, author_artist_id)
  where opportunity_id is not null and author_artist_id is not null;

alter table public.venue_reviews enable row level security;

drop trigger if exists set_venue_reviews_updated_at on public.venue_reviews;
create trigger set_venue_reviews_updated_at
before update on public.venue_reviews
for each row execute function public.set_updated_at();

drop policy if exists "Authenticated users can read venue reviews" on public.venue_reviews;
create policy "Authenticated users can read venue reviews"
on public.venue_reviews
for select
to authenticated
using (true);

drop policy if exists "Artists can insert their own venue reviews" on public.venue_reviews;
create policy "Artists can insert their own venue reviews"
on public.venue_reviews
for insert
to authenticated
with check (
  author_artist_id = (select auth.uid())
);

drop policy if exists "Artists can update their own venue reviews" on public.venue_reviews;
create policy "Artists can update their own venue reviews"
on public.venue_reviews
for update
to authenticated
using (author_artist_id = (select auth.uid()))
with check (author_artist_id = (select auth.uid()));

drop policy if exists "Artists can delete their own venue reviews" on public.venue_reviews;
create policy "Artists can delete their own venue reviews"
on public.venue_reviews
for delete
to authenticated
using (author_artist_id = (select auth.uid()));

with ordered_opportunities as (
  select
    o.id as opportunity_id,
    o.venue_id,
    row_number() over (partition by o.venue_id order by o.created_at asc, o.id asc) as seq
  from public.opportunities o
),
target_venues as (
  select distinct venue_id
  from ordered_opportunities
),
seed_reviews as (
  select *
  from (
    values
      (1, 'Duo Mar Azul', 'Santos/SP', 5, 'Palco organizado, equipe tranquila e briefing claro do inicio ao fim.', 28),
      (1, 'Lucas e Voz', 'Praia Grande/SP', 4, 'Pagamento combinado e boa receptividade. Voltaria a tocar na casa.', 19),
      (2, 'Banda Costeira', 'Sao Vicente/SP', 5, 'Casa cheia, som equilibrado e comunicacao muito objetiva com o contratante.', 11)
  ) as seed(target_seq, reviewer_name, reviewer_city, rating, comment, days_ago)
)
insert into public.venue_reviews (
  venue_id,
  opportunity_id,
  reviewer_name,
  reviewer_city,
  rating,
  comment,
  created_at,
  updated_at
)
select
  tv.venue_id,
  coalesce(
    (
      select oo.opportunity_id
      from ordered_opportunities oo
      where oo.venue_id = tv.venue_id and oo.seq = seed.target_seq
    ),
    (
      select oo.opportunity_id
      from ordered_opportunities oo
      where oo.venue_id = tv.venue_id
      order by oo.seq asc
      limit 1
    )
  ) as opportunity_id,
  seed.reviewer_name,
  seed.reviewer_city,
  seed.rating,
  seed.comment,
  timezone('utc', now()) - make_interval(days => seed.days_ago),
  timezone('utc', now()) - make_interval(days => seed.days_ago)
from target_venues tv
cross join seed_reviews seed
where not exists (
  select 1
  from public.venue_reviews vr
  where vr.venue_id = tv.venue_id
    and vr.reviewer_name = seed.reviewer_name
    and vr.comment = seed.comment
);
