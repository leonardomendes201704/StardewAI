alter table public.artist_profiles
add column if not exists postal_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_profiles_postal_code_format_check'
  ) then
    alter table public.artist_profiles
    add constraint artist_profiles_postal_code_format_check
    check (postal_code is null or postal_code ~ '^[0-9]{8}$');
  end if;
end
$$;

create index if not exists artist_profiles_postal_code_idx
on public.artist_profiles (postal_code);

