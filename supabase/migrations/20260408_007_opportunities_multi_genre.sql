alter table public.opportunities
  add column music_genres text[] not null default '{}'::text[];

update public.opportunities
set music_genres = case
  when music_genre is null or btrim(music_genre) = '' then '{}'::text[]
  else array[music_genre]
end;

alter table public.opportunities
  add constraint opportunities_music_genres_check
  check (coalesce(array_length(music_genres, 1), 0) > 0);

alter table public.opportunities
  drop column music_genre;

alter table public.opportunities
  alter column music_genres drop default;
