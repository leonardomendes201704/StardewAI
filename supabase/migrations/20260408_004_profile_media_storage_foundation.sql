alter table public.artist_profiles
  add column if not exists repertoire_summary text;

create table if not exists public.venue_media_assets (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venue_profiles (account_id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  mime_type text,
  file_size_bytes integer check (file_size_bytes is null or file_size_bytes >= 0),
  width integer check (width is null or width >= 0),
  height integer check (height is null or height >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.artist_media_assets (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles (account_id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  mime_type text,
  file_size_bytes integer check (file_size_bytes is null or file_size_bytes >= 0),
  width integer check (width is null or width >= 0),
  height integer check (height is null or height >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists venue_media_assets_venue_id_sort_idx
  on public.venue_media_assets (venue_id, sort_order, created_at);

create index if not exists artist_media_assets_artist_id_sort_idx
  on public.artist_media_assets (artist_id, sort_order, created_at);

insert into storage.buckets (id, name, public)
select 'profile-media', 'profile-media', true
where not exists (
  select 1
  from storage.buckets
  where id = 'profile-media'
);

create or replace function public.sync_venue_cover_image_from_media()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_venue_id uuid;
begin
  target_venue_id := coalesce(new.venue_id, old.venue_id);

  update public.venue_profiles
  set cover_image_url = (
    select assets.public_url
    from public.venue_media_assets as assets
    where assets.venue_id = target_venue_id
    order by assets.sort_order asc, assets.created_at asc
    limit 1
  )
  where account_id = target_venue_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists set_venue_media_assets_updated_at on public.venue_media_assets;
create trigger set_venue_media_assets_updated_at
before update on public.venue_media_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_artist_media_assets_updated_at on public.artist_media_assets;
create trigger set_artist_media_assets_updated_at
before update on public.artist_media_assets
for each row execute function public.set_updated_at();

drop trigger if exists sync_venue_cover_image_after_insert on public.venue_media_assets;
create trigger sync_venue_cover_image_after_insert
after insert on public.venue_media_assets
for each row execute function public.sync_venue_cover_image_from_media();

drop trigger if exists sync_venue_cover_image_after_update on public.venue_media_assets;
create trigger sync_venue_cover_image_after_update
after update on public.venue_media_assets
for each row execute function public.sync_venue_cover_image_from_media();

drop trigger if exists sync_venue_cover_image_after_delete on public.venue_media_assets;
create trigger sync_venue_cover_image_after_delete
after delete on public.venue_media_assets
for each row execute function public.sync_venue_cover_image_from_media();

alter table public.venue_media_assets enable row level security;
alter table public.artist_media_assets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'venue_media_assets'
      and policyname = 'venue_media_assets_select_authenticated'
  ) then
    create policy "venue_media_assets_select_authenticated"
    on public.venue_media_assets
    for select
    to authenticated
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'venue_media_assets'
      and policyname = 'venue_media_assets_insert_own'
  ) then
    create policy "venue_media_assets_insert_own"
    on public.venue_media_assets
    for insert
    to authenticated
    with check ((select auth.uid()) = venue_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'venue_media_assets'
      and policyname = 'venue_media_assets_update_own'
  ) then
    create policy "venue_media_assets_update_own"
    on public.venue_media_assets
    for update
    to authenticated
    using ((select auth.uid()) = venue_id)
    with check ((select auth.uid()) = venue_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'venue_media_assets'
      and policyname = 'venue_media_assets_delete_own'
  ) then
    create policy "venue_media_assets_delete_own"
    on public.venue_media_assets
    for delete
    to authenticated
    using ((select auth.uid()) = venue_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'artist_media_assets'
      and policyname = 'artist_media_assets_select_authenticated'
  ) then
    create policy "artist_media_assets_select_authenticated"
    on public.artist_media_assets
    for select
    to authenticated
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'artist_media_assets'
      and policyname = 'artist_media_assets_insert_own'
  ) then
    create policy "artist_media_assets_insert_own"
    on public.artist_media_assets
    for insert
    to authenticated
    with check ((select auth.uid()) = artist_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'artist_media_assets'
      and policyname = 'artist_media_assets_update_own'
  ) then
    create policy "artist_media_assets_update_own"
    on public.artist_media_assets
    for update
    to authenticated
    using ((select auth.uid()) = artist_id)
    with check ((select auth.uid()) = artist_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'artist_media_assets'
      and policyname = 'artist_media_assets_delete_own'
  ) then
    create policy "artist_media_assets_delete_own"
    on public.artist_media_assets
    for delete
    to authenticated
    using ((select auth.uid()) = artist_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_media_public_read'
  ) then
    create policy "profile_media_public_read"
    on storage.objects
    for select
    to public
    using (bucket_id = 'profile-media');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_media_upload_own_folder'
  ) then
    create policy "profile_media_upload_own_folder"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'profile-media'
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_media_update_own_folder'
  ) then
    create policy "profile_media_update_own_folder"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'profile-media'
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
    with check (
      bucket_id = 'profile-media'
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_media_delete_own_folder'
  ) then
    create policy "profile_media_delete_own_folder"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'profile-media'
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    );
  end if;
end
$$;
