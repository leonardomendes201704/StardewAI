create schema if not exists private;

grant usage on schema private to authenticated;

create or replace function private.user_owns_opportunity(target_opportunity_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.opportunities
    where id = target_opportunity_id
      and venue_id = (select auth.uid())
  );
$$;

create or replace function private.user_has_opportunity_application(target_opportunity_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.opportunity_applications
    where opportunity_id = target_opportunity_id
      and artist_id = (select auth.uid())
  );
$$;

create or replace function private.opportunity_is_open_for_application(target_opportunity_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.opportunities
    where id = target_opportunity_id
      and status = 'open'
      and venue_id <> (select auth.uid())
  );
$$;

grant execute on function private.user_owns_opportunity(uuid) to authenticated;
grant execute on function private.user_has_opportunity_application(uuid) to authenticated;
grant execute on function private.opportunity_is_open_for_application(uuid) to authenticated;

drop policy if exists "opportunities_select_open_own_or_applied" on public.opportunities;

create policy "opportunities_select_open_own_or_applied"
on public.opportunities
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    status = 'open'
    or venue_id = (select auth.uid())
    or (select private.user_has_opportunity_application(id))
  )
);

drop policy if exists "opportunity_applications_select_own_or_venue" on public.opportunity_applications;

create policy "opportunity_applications_select_own_or_venue"
on public.opportunity_applications
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    artist_id = (select auth.uid())
    or (select private.user_owns_opportunity(opportunity_id))
  )
);

drop policy if exists "opportunity_applications_insert_own_open" on public.opportunity_applications;

create policy "opportunity_applications_insert_own_open"
on public.opportunity_applications
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and artist_id = (select auth.uid())
  and exists (
    select 1
    from public.accounts
    where id = (select auth.uid())
      and account_type = 'musician'
  )
  and (select private.opportunity_is_open_for_application(opportunity_id))
);
