create or replace function public.apply_to_open_opportunity(target_opportunity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_account_type public.account_type;
  existing_application record;
  target_opportunity record;
  result_application_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para se candidatar.';
  end if;

  select a.account_type
  into current_account_type
  from public.accounts a
  where a.id = current_user_id;

  if current_account_type is distinct from 'musician' then
    raise exception 'Apenas contas de Musico podem se candidatar a vagas.';
  end if;

  select
    o.id,
    o.status,
    o.venue_id
  into target_opportunity
  from public.opportunities o
  where o.id = target_opportunity_id;

  if target_opportunity is null then
    raise exception 'Nao foi possivel localizar esta vaga.';
  end if;

  if target_opportunity.venue_id = current_user_id then
    raise exception 'Voce nao pode se candidatar a uma vaga da sua propria conta.';
  end if;

  if target_opportunity.status <> 'open' then
    raise exception 'Esta vaga nao aceita novas candidaturas no momento.';
  end if;

  select
    oa.id,
    oa.status
  into existing_application
  from public.opportunity_applications oa
  where oa.opportunity_id = target_opportunity_id
    and oa.artist_id = current_user_id
  limit 1;

  if existing_application is not null then
    if existing_application.status = 'declined' then
      raise exception 'Voce ja recusou um convite desta vaga.';
    end if;

    if existing_application.status = 'rejected' then
      raise exception 'Sua participacao nesta vaga ja foi encerrada.';
    end if;

    if existing_application.status = 'withdrawn' then
      raise exception 'Esta vaga ja teve uma candidatura sua encerrada.';
    end if;

    raise exception 'Voce ja se candidatou a esta vaga.';
  end if;

  insert into public.opportunity_applications (
    opportunity_id,
    artist_id,
    source,
    status
  )
  values (
    target_opportunity_id,
    current_user_id,
    'marketplace_apply',
    'submitted'
  )
  returning id into result_application_id;

  return result_application_id;
end;
$$;

revoke all on function public.apply_to_open_opportunity(uuid) from public;
grant execute on function public.apply_to_open_opportunity(uuid) to authenticated;
