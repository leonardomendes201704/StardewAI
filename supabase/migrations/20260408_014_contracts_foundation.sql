create type public.contract_status as enum (
  'pending_confirmation',
  'confirmed',
  'completed',
  'cancelled'
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.opportunity_applications(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  venue_id uuid not null references public.venue_profiles(account_id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(account_id) on delete cascade,
  status public.contract_status not null default 'pending_confirmation',
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contracts_application_unique unique (application_id)
);

create unique index contracts_unique_active_opportunity_idx
  on public.contracts (opportunity_id)
  where status in ('pending_confirmation', 'confirmed', 'completed');

create index contracts_venue_status_created_idx
  on public.contracts (venue_id, status, created_at desc);

create index contracts_artist_status_created_idx
  on public.contracts (artist_id, status, created_at desc);

create or replace function public.set_contracts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_contracts_updated_at
before update on public.contracts
for each row
execute function public.set_contracts_updated_at();

alter table public.contracts enable row level security;

create policy "contracts_select_participants"
on public.contracts
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    venue_id = (select auth.uid())
    or artist_id = (select auth.uid())
  )
);

create schema if not exists private;

grant usage on schema private to authenticated;

create or replace function public.select_opportunity_candidate_for_contract(target_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_application record;
  existing_contract record;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para selecionar um candidato.';
  end if;

  select
    oa.id,
    oa.artist_id,
    oa.opportunity_id,
    o.venue_id,
    o.status as opportunity_status
  into selected_application
  from public.opportunity_applications oa
  join public.opportunities o
    on o.id = oa.opportunity_id
  join public.accounts a
    on a.id = current_user_id
  where oa.id = target_application_id
    and o.venue_id = current_user_id
    and a.account_type = 'bar';

  if selected_application is null then
    raise exception 'Nao foi possivel selecionar este candidato para sua vaga.';
  end if;

  if selected_application.opportunity_status <> 'open' then
    raise exception 'Esta vaga nao esta aberta para uma nova contratacao.';
  end if;

  select
    c.id,
    c.application_id,
    c.status
  into existing_contract
  from public.contracts c
  where c.opportunity_id = selected_application.opportunity_id
    and c.status in ('pending_confirmation', 'confirmed', 'completed')
  order by c.created_at desc
  limit 1;

  if existing_contract is not null then
    if existing_contract.application_id = target_application_id then
      return;
    end if;

    raise exception 'Esta vaga ja possui uma contratacao em andamento.';
  end if;

  insert into public.contracts (
    application_id,
    opportunity_id,
    venue_id,
    artist_id,
    status
  )
  values (
    selected_application.id,
    selected_application.opportunity_id,
    selected_application.venue_id,
    selected_application.artist_id,
    'pending_confirmation'
  )
  on conflict (application_id) do nothing;
end;
$$;

revoke all on function public.select_opportunity_candidate_for_contract(uuid) from public;
grant execute on function public.select_opportunity_candidate_for_contract(uuid) to authenticated;

create or replace function public.confirm_opportunity_contract(target_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_contract record;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para confirmar a contratacao.';
  end if;

  select
    c.id,
    c.application_id,
    c.opportunity_id,
    c.artist_id,
    c.status
  into target_contract
  from public.contracts c
  where c.id = target_contract_id
    and c.artist_id = current_user_id;

  if target_contract is null then
    raise exception 'Nao foi possivel localizar esta contratacao para sua conta.';
  end if;

  if target_contract.status = 'confirmed' then
    return;
  end if;

  if target_contract.status <> 'pending_confirmation' then
    raise exception 'Esta contratacao nao esta aguardando confirmacao.';
  end if;

  update public.contracts
  set
    status = 'confirmed',
    confirmed_at = timezone('utc', now()),
    cancelled_at = null
  where id = target_contract.id;

  update public.opportunity_applications
  set status = 'accepted'
  where id = target_contract.application_id;

  update public.opportunity_applications
  set status = 'rejected'
  where opportunity_id = target_contract.opportunity_id
    and id <> target_contract.application_id
    and status in ('submitted', 'shortlisted');

  update public.opportunities
  set status = 'closed'
  where id = target_contract.opportunity_id;
end;
$$;

revoke all on function public.confirm_opportunity_contract(uuid) from public;
grant execute on function public.confirm_opportunity_contract(uuid) to authenticated;
