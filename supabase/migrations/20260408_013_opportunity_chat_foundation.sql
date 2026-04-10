create table if not exists public.opportunity_chat_threads (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.opportunity_applications(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  venue_id uuid not null references public.venue_profiles(account_id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(account_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists opportunity_chat_threads_venue_updated_at_idx
  on public.opportunity_chat_threads (venue_id, updated_at desc);

create index if not exists opportunity_chat_threads_artist_updated_at_idx
  on public.opportunity_chat_threads (artist_id, updated_at desc);

create table if not exists public.opportunity_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.opportunity_chat_threads(id) on delete cascade,
  sender_id uuid not null references public.accounts(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists opportunity_chat_messages_thread_created_at_idx
  on public.opportunity_chat_messages (thread_id, created_at asc);

create or replace function public.create_opportunity_chat_thread_for_application()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.opportunity_chat_threads (
    application_id,
    opportunity_id,
    venue_id,
    artist_id
  )
  select
    new.id,
    new.opportunity_id,
    o.venue_id,
    new.artist_id
  from public.opportunities o
  where o.id = new.opportunity_id
  on conflict (application_id) do nothing;

  return new;
end;
$$;

create or replace function public.touch_opportunity_chat_thread_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.opportunity_chat_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists set_opportunity_chat_threads_updated_at on public.opportunity_chat_threads;
create trigger set_opportunity_chat_threads_updated_at
before update on public.opportunity_chat_threads
for each row execute function public.set_updated_at();

drop trigger if exists create_opportunity_chat_thread_after_application_insert on public.opportunity_applications;
create trigger create_opportunity_chat_thread_after_application_insert
after insert on public.opportunity_applications
for each row execute function public.create_opportunity_chat_thread_for_application();

drop trigger if exists touch_opportunity_chat_thread_after_message_insert on public.opportunity_chat_messages;
create trigger touch_opportunity_chat_thread_after_message_insert
after insert on public.opportunity_chat_messages
for each row execute function public.touch_opportunity_chat_thread_updated_at();

insert into public.opportunity_chat_threads (
  application_id,
  opportunity_id,
  venue_id,
  artist_id
)
select
  oa.id,
  oa.opportunity_id,
  o.venue_id,
  oa.artist_id
from public.opportunity_applications oa
join public.opportunities o
  on o.id = oa.opportunity_id
on conflict (application_id) do nothing;

alter table public.opportunity_chat_threads enable row level security;
alter table public.opportunity_chat_messages enable row level security;

drop policy if exists "Participants can read opportunity chat threads" on public.opportunity_chat_threads;
create policy "Participants can read opportunity chat threads"
on public.opportunity_chat_threads
for select
to authenticated
using (
  venue_id = (select auth.uid())
  or artist_id = (select auth.uid())
);

drop policy if exists "Participants can read opportunity chat messages" on public.opportunity_chat_messages;
create policy "Participants can read opportunity chat messages"
on public.opportunity_chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.opportunity_chat_threads thread
    where thread.id = thread_id
      and (
        thread.venue_id = (select auth.uid())
        or thread.artist_id = (select auth.uid())
      )
  )
);

drop policy if exists "Participants can insert opportunity chat messages" on public.opportunity_chat_messages;
create policy "Participants can insert opportunity chat messages"
on public.opportunity_chat_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.opportunity_chat_threads thread
    where thread.id = thread_id
      and (
        thread.venue_id = (select auth.uid())
        or thread.artist_id = (select auth.uid())
      )
  )
);
