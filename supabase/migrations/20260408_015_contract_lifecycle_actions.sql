create or replace function public.cancel_opportunity_contract(target_contract_id uuid)
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
    raise exception 'Sessao expirada. Entre novamente para atualizar esta contratacao.';
  end if;

  select
    c.id,
    c.application_id,
    c.opportunity_id,
    c.status,
    c.venue_id,
    c.artist_id
  into target_contract
  from public.contracts c
  where c.id = target_contract_id
    and (
      c.venue_id = current_user_id
      or c.artist_id = current_user_id
    );

  if target_contract is null then
    raise exception 'Nao foi possivel localizar esta contratacao para sua conta.';
  end if;

  if target_contract.status = 'cancelled' then
    return;
  end if;

  if target_contract.status = 'completed' then
    raise exception 'Um show concluido nao pode voltar para cancelado nesta etapa.';
  end if;

  if target_contract.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'Esta contratacao nao pode ser cancelada neste momento.';
  end if;

  update public.contracts
  set
    status = 'cancelled',
    cancelled_at = timezone('utc', now())
  where id = target_contract.id;
end;
$$;

revoke all on function public.cancel_opportunity_contract(uuid) from public;
grant execute on function public.cancel_opportunity_contract(uuid) to authenticated;

create or replace function public.complete_opportunity_contract(target_contract_id uuid)
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
    raise exception 'Sessao expirada. Entre novamente para atualizar esta contratacao.';
  end if;

  select
    c.id,
    c.status,
    c.venue_id,
    c.artist_id
  into target_contract
  from public.contracts c
  where c.id = target_contract_id
    and (
      c.venue_id = current_user_id
      or c.artist_id = current_user_id
    );

  if target_contract is null then
    raise exception 'Nao foi possivel localizar esta contratacao para sua conta.';
  end if;

  if target_contract.status = 'completed' then
    return;
  end if;

  if target_contract.status = 'cancelled' then
    raise exception 'Uma contratacao cancelada nao pode ser concluida.';
  end if;

  if target_contract.status <> 'confirmed' then
    raise exception 'Somente shows confirmados podem ser marcados como concluidos.';
  end if;

  update public.contracts
  set
    status = 'completed',
    completed_at = timezone('utc', now()),
    cancelled_at = null
  where id = target_contract.id;
end;
$$;

revoke all on function public.complete_opportunity_contract(uuid) from public;
grant execute on function public.complete_opportunity_contract(uuid) to authenticated;
