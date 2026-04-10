create type public.account_type as enum ('bar', 'musician');

create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  account_type public.account_type not null,
  email text,
  display_name text,
  profile_completed boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.venue_profiles (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  venue_name text,
  venue_type text,
  city text,
  state text,
  neighborhood text,
  address_text text,
  capacity integer check (capacity is null or capacity >= 0),
  performance_days text[] not null default '{}',
  bio text,
  cover_image_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.artist_profiles (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  stage_name text,
  artist_category text,
  city text,
  state text,
  performance_radius_km integer check (performance_radius_km is null or performance_radius_km >= 0),
  base_cache_cents integer check (base_cache_cents is null or base_cache_cents >= 0),
  bio text,
  structure_summary text,
  instagram_handle text,
  youtube_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.genres (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamp with time zone not null default now()
);

create table public.artist_genres (
  artist_id uuid not null references public.artist_profiles (account_id) on delete cascade,
  genre_id bigint not null references public.genres (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (artist_id, genre_id)
);

create index accounts_account_type_idx on public.accounts (account_type);
create index venue_profiles_city_state_idx on public.venue_profiles (city, state);
create index artist_profiles_city_state_idx on public.artist_profiles (city, state);
create index artist_genres_genre_id_idx on public.artist_genres (genre_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

create trigger set_venue_profiles_updated_at
before update on public.venue_profiles
for each row execute function public.set_updated_at();

create trigger set_artist_profiles_updated_at
before update on public.artist_profiles
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_account_type public.account_type;
begin
  next_account_type := case lower(coalesce(new.raw_user_meta_data ->> 'account_type', ''))
    when 'bar' then 'bar'::public.account_type
    when 'musician' then 'musician'::public.account_type
    else null
  end;

  if next_account_type is null then
    raise exception 'account_type metadata is required for new users';
  end if;

  insert into public.accounts (
    id,
    account_type,
    email,
    display_name
  )
  values (
    new.id,
    next_account_type,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  );

  if next_account_type = 'bar'::public.account_type then
    insert into public.venue_profiles (
      account_id,
      venue_name,
      city,
      state
    )
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'venue_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'state'), '')
    );
  else
    insert into public.artist_profiles (
      account_id,
      stage_name,
      city,
      state
    )
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'stage_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'state'), '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.accounts
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_updated();

alter table public.accounts enable row level security;
alter table public.venue_profiles enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.genres enable row level security;
alter table public.artist_genres enable row level security;

create policy "accounts_select_own"
on public.accounts
for select
to authenticated
using ((select auth.uid()) = id);

create policy "accounts_insert_own"
on public.accounts
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "accounts_update_own"
on public.accounts
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "venue_profiles_select_authenticated"
on public.venue_profiles
for select
to authenticated
using (true);

create policy "venue_profiles_insert_own"
on public.venue_profiles
for insert
to authenticated
with check ((select auth.uid()) = account_id);

create policy "venue_profiles_update_own"
on public.venue_profiles
for update
to authenticated
using ((select auth.uid()) = account_id)
with check ((select auth.uid()) = account_id);

create policy "artist_profiles_select_authenticated"
on public.artist_profiles
for select
to authenticated
using (true);

create policy "artist_profiles_insert_own"
on public.artist_profiles
for insert
to authenticated
with check ((select auth.uid()) = account_id);

create policy "artist_profiles_update_own"
on public.artist_profiles
for update
to authenticated
using ((select auth.uid()) = account_id)
with check ((select auth.uid()) = account_id);

create policy "genres_select_authenticated"
on public.genres
for select
to authenticated
using (true);

create policy "artist_genres_select_authenticated"
on public.artist_genres
for select
to authenticated
using (true);

create policy "artist_genres_insert_own"
on public.artist_genres
for insert
to authenticated
with check ((select auth.uid()) = artist_id);

create policy "artist_genres_delete_own"
on public.artist_genres
for delete
to authenticated
using ((select auth.uid()) = artist_id);

insert into public.genres (name, slug)
values
  ('MPB', 'mpb'),
  ('Pop Rock', 'pop-rock'),
  ('Sertanejo', 'sertanejo'),
  ('Pagode', 'pagode'),
  ('Samba', 'samba'),
  ('Forro', 'forro'),
  ('Jazz', 'jazz'),
  ('Blues', 'blues'),
  ('Acustico', 'acustico'),
  ('DJ Set', 'dj-set');
