do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'opportunity_application_source'
  ) then
    create type public.opportunity_application_source as enum (
      'marketplace_apply',
      'direct_invite'
    );
  end if;
end;
$$;

alter table public.opportunity_applications
  add column if not exists source public.opportunity_application_source;

update public.opportunity_applications oa
set source = case
  when oa.status in ('invited', 'declined') then 'direct_invite'::public.opportunity_application_source
  when exists (
    select 1
    from public.contracts c
    where c.application_id = oa.id
      and c.created_at = oa.created_at
  ) then 'direct_invite'::public.opportunity_application_source
  else 'marketplace_apply'::public.opportunity_application_source
end;

alter table public.opportunity_applications
  alter column source set default 'marketplace_apply',
  alter column source set not null;

create index if not exists opportunity_applications_artist_source_status_idx
  on public.opportunity_applications (artist_id, source, status, created_at desc);

create index if not exists opportunity_applications_opportunity_source_status_idx
  on public.opportunity_applications (opportunity_id, source, status, created_at desc);

drop policy if exists "opportunity_applications_insert_own_open" on public.opportunity_applications;

create policy "opportunity_applications_insert_own_open"
on public.opportunity_applications
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and artist_id = (select auth.uid())
  and status = 'submitted'
  and source = 'marketplace_apply'
  and exists (
    select 1
    from public.accounts
    where id = (select auth.uid())
      and account_type = 'musician'
  )
  and opportunity_id in (
    select id
    from public.opportunities
    where status = 'open'
      and venue_id <> (select auth.uid())
  )
);

create or replace function public.create_direct_opportunity_invite(
  target_opportunity_id uuid,
  target_artist_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_opportunity record;
  existing_application record;
  active_contract record;
  application_contract record;
  result_application_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para enviar o convite.';
  end if;

  select
    o.id,
    o.status,
    o.venue_id
  into owned_opportunity
  from public.opportunities o
  join public.accounts a
    on a.id = current_user_id
  where o.id = target_opportunity_id
    and o.venue_id = current_user_id
    and a.account_type = 'bar';

  if owned_opportunity is null then
    raise exception 'Nao foi possivel localizar esta vaga para sua conta.';
  end if;

  if owned_opportunity.status not in ('draft', 'open') then
    raise exception 'Apenas vagas abertas ou em rascunho aceitam convite direto.';
  end if;

  if not exists (
    select 1
    from public.accounts a
    where a.id = target_artist_id
      and a.account_type = 'musician'
  ) then
    raise exception 'Nao foi possivel localizar este musico para convite.';
  end if;

  select
    oa.id,
    oa.status,
    oa.source
  into existing_application
  from public.opportunity_applications oa
  where oa.opportunity_id = target_opportunity_id
    and oa.artist_id = target_artist_id
  limit 1;

  if existing_application is not null then
    result_application_id := existing_application.id;
  else
    insert into public.opportunity_applications (
      opportunity_id,
      artist_id,
      source,
      status
    )
    values (
      target_opportunity_id,
      target_artist_id,
      'direct_invite',
      'invited'
    )
    returning id into result_application_id;
  end if;

  select
    c.id,
    c.application_id,
    c.status
  into active_contract
  from public.contracts c
  where c.opportunity_id = target_opportunity_id
    and c.status in ('pending_confirmation', 'confirmed', 'completed')
  order by c.created_at desc
  limit 1;

  if active_contract is not null and active_contract.application_id <> result_application_id then
    raise exception 'Esta vaga ja possui uma contratacao em andamento.';
  end if;

  select
    c.id,
    c.status
  into application_contract
  from public.contracts c
  where c.application_id = result_application_id
  limit 1;

  if application_contract is not null and application_contract.status in ('confirmed', 'completed') then
    return result_application_id;
  end if;

  update public.opportunity_applications
  set
    source = 'direct_invite',
    status = 'invited'
  where id = result_application_id
    and status <> 'accepted';

  insert into public.opportunity_chat_threads (
    application_id,
    opportunity_id,
    venue_id,
    artist_id
  )
  values (
    result_application_id,
    target_opportunity_id,
    current_user_id,
    target_artist_id
  )
  on conflict (application_id) do nothing;

  if application_contract is null then
    insert into public.contracts (
      application_id,
      opportunity_id,
      venue_id,
      artist_id,
      status
    )
    values (
      result_application_id,
      target_opportunity_id,
      current_user_id,
      target_artist_id,
      'pending_confirmation'
    )
    on conflict (application_id) do nothing;
  elsif application_contract.status = 'cancelled' then
    update public.contracts
    set
      status = 'pending_confirmation',
      confirmed_at = null,
      completed_at = null,
      cancelled_at = null
    where id = application_contract.id;
  end if;

  return result_application_id;
end;
$$;

revoke all on function public.create_direct_opportunity_invite(uuid, uuid) from public;
grant execute on function public.create_direct_opportunity_invite(uuid, uuid) to authenticated;
