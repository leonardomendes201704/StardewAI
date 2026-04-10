alter table public.venue_profiles
  add column postal_code text check (postal_code is null or postal_code ~ '^[0-9]{8}$'),
  add column street text,
  add column address_number text,
  add column address_complement text;

create index venue_profiles_postal_code_idx on public.venue_profiles (postal_code);
