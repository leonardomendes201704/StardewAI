do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e
      on e.enumtypid = t.oid
    where t.typname = 'opportunity_application_status'
      and e.enumlabel = 'invited'
  ) then
    alter type public.opportunity_application_status add value 'invited';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e
      on e.enumtypid = t.oid
    where t.typname = 'opportunity_application_status'
      and e.enumlabel = 'declined'
  ) then
    alter type public.opportunity_application_status add value 'declined';
  end if;
end;
$$;

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
    oa.status
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
      status
    )
    values (
      target_opportunity_id,
      target_artist_id,
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
  set status = 'invited'
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

create or replace function public.decline_direct_opportunity_invite(target_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_invite record;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para responder o convite.';
  end if;

  select
    c.id,
    c.application_id,
    c.status as contract_status,
    oa.status as application_status
  into target_invite
  from public.contracts c
  join public.opportunity_applications oa
    on oa.id = c.application_id
  where c.id = target_contract_id
    and c.artist_id = current_user_id;

  if target_invite is null then
    raise exception 'Nao foi possivel localizar este convite para sua conta.';
  end if;

  if target_invite.application_status <> 'invited' then
    raise exception 'Este registro nao esta mais aguardando resposta de convite.';
  end if;

  if target_invite.contract_status = 'cancelled' then
    update public.opportunity_applications
    set status = 'declined'
    where id = target_invite.application_id;

    return;
  end if;

  if target_invite.contract_status <> 'pending_confirmation' then
    raise exception 'Este convite nao esta mais aguardando sua resposta.';
  end if;

  update public.contracts
  set
    status = 'cancelled',
    confirmed_at = null,
    completed_at = null,
    cancelled_at = timezone('utc', now())
  where id = target_invite.id;

  update public.opportunity_applications
  set status = 'declined'
  where id = target_invite.application_id;
end;
$$;

revoke all on function public.decline_direct_opportunity_invite(uuid) from public;
grant execute on function public.decline_direct_opportunity_invite(uuid) to authenticated;

create or replace function public.cancel_direct_opportunity_invite(target_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_invite record;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para atualizar este convite.';
  end if;

  select
    c.id,
    c.application_id,
    c.status as contract_status,
    oa.status as application_status
  into target_invite
  from public.contracts c
  join public.opportunity_applications oa
    on oa.id = c.application_id
  where c.id = target_contract_id
    and c.venue_id = current_user_id;

  if target_invite is null then
    raise exception 'Nao foi possivel localizar este convite para sua conta.';
  end if;

  if target_invite.application_status <> 'invited' then
    raise exception 'Este registro nao representa mais um convite direto pendente.';
  end if;

  if target_invite.contract_status = 'cancelled' then
    update public.opportunity_applications
    set status = 'rejected'
    where id = target_invite.application_id;

    return;
  end if;

  if target_invite.contract_status <> 'pending_confirmation' then
    raise exception 'Este convite nao pode mais ser cancelado nesta etapa.';
  end if;

  update public.contracts
  set
    status = 'cancelled',
    confirmed_at = null,
    completed_at = null,
    cancelled_at = timezone('utc', now())
  where id = target_invite.id;

  update public.opportunity_applications
  set status = 'rejected'
  where id = target_invite.application_id;
end;
$$;

revoke all on function public.cancel_direct_opportunity_invite(uuid) from public;
grant execute on function public.cancel_direct_opportunity_invite(uuid) to authenticated;
