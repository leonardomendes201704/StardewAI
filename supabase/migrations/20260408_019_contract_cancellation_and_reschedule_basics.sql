alter table public.contracts
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_by uuid references public.accounts(id) on delete set null,
  add column if not exists last_rescheduled_at timestamptz,
  add column if not exists last_rescheduled_by uuid references public.accounts(id) on delete set null,
  add column if not exists last_reschedule_reason text;

update public.contracts
set cancellation_reason = 'Cancelamento operacional sem motivo detalhado.'
where status = 'cancelled'
  and cancellation_reason is null;

alter table public.contracts
  drop constraint if exists contracts_cancellation_reason_chk;

alter table public.contracts
  add constraint contracts_cancellation_reason_chk
  check (
    cancellation_reason is null
    or char_length(trim(both from cancellation_reason)) between 8 and 400
  );

alter table public.contracts
  drop constraint if exists contracts_last_reschedule_reason_chk;

alter table public.contracts
  add constraint contracts_last_reschedule_reason_chk
  check (
    last_reschedule_reason is null
    or char_length(trim(both from last_reschedule_reason)) between 8 and 400
  );

create table if not exists public.contract_schedule_changes (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  changed_by uuid not null references public.accounts(id) on delete cascade,
  reason text not null check (char_length(trim(both from reason)) between 8 and 400),
  previous_event_date date not null,
  previous_start_time time not null,
  previous_duration_hours integer not null check (previous_duration_hours > 0 and previous_duration_hours <= 12),
  previous_location_label text not null check (char_length(trim(both from previous_location_label)) >= 2),
  new_event_date date not null,
  new_start_time time not null,
  new_duration_hours integer not null check (new_duration_hours > 0 and new_duration_hours <= 12),
  new_location_label text not null check (char_length(trim(both from new_location_label)) >= 2),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists contract_schedule_changes_contract_created_idx
  on public.contract_schedule_changes (contract_id, created_at desc);

create index if not exists contract_schedule_changes_opportunity_created_idx
  on public.contract_schedule_changes (opportunity_id, created_at desc);

alter table public.contract_schedule_changes enable row level security;

drop policy if exists "contract_schedule_changes_select_participants" on public.contract_schedule_changes;

create policy "contract_schedule_changes_select_participants"
on public.contract_schedule_changes
for select
to authenticated
using (
  (select auth.uid()) is not null
  and contract_id in (
    select c.id
    from public.contracts c
    where c.venue_id = (select auth.uid())
       or c.artist_id = (select auth.uid())
  )
);

create or replace function public.cancel_opportunity_contract_with_reason(
  target_contract_id uuid,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_reason text := nullif(trim(both from target_reason), '');
  target_contract record;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para atualizar esta contratacao.';
  end if;

  if normalized_reason is null or char_length(normalized_reason) < 8 then
    raise exception 'Descreva um motivo com pelo menos 8 caracteres para cancelar.';
  end if;

  select
    c.id,
    c.application_id,
    c.opportunity_id,
    c.status,
    c.venue_id,
    c.artist_id,
    oa.source,
    oa.status as application_status
  into target_contract
  from public.contracts c
  join public.opportunity_applications oa
    on oa.id = c.application_id
  where c.id = target_contract_id
    and (
      c.venue_id = current_user_id
      or c.artist_id = current_user_id
    );

  if target_contract is null then
    raise exception 'Nao foi possivel localizar esta contratacao para sua conta.';
  end if;

  if target_contract.status = 'cancelled' then
    update public.contracts
    set
      cancellation_reason = normalized_reason,
      cancelled_by = current_user_id
    where id = target_contract.id;

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
    cancelled_at = timezone('utc', now()),
    cancellation_reason = normalized_reason,
    cancelled_by = current_user_id
  where id = target_contract.id;

  if target_contract.source = 'direct_invite'
     and target_contract.status = 'pending_confirmation'
     and target_contract.application_status = 'invited' then
    update public.opportunity_applications
    set status = 'rejected'
    where id = target_contract.application_id;
  end if;
end;
$$;

revoke all on function public.cancel_opportunity_contract_with_reason(uuid, text) from public;
grant execute on function public.cancel_opportunity_contract_with_reason(uuid, text) to authenticated;

create or replace function public.cancel_opportunity_contract(target_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.cancel_opportunity_contract_with_reason(
    target_contract_id,
    'Cancelamento operacional sem motivo detalhado.'
  );
end;
$$;

revoke all on function public.cancel_opportunity_contract(uuid) from public;
grant execute on function public.cancel_opportunity_contract(uuid) to authenticated;

create or replace function public.reschedule_opportunity_contract(
  target_contract_id uuid,
  target_event_date date,
  target_start_time time,
  target_duration_hours integer,
  target_location_label text,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_reason text := nullif(trim(both from target_reason), '');
  normalized_location_label text := nullif(trim(both from target_location_label), '');
  target_contract record;
begin
  if current_user_id is null then
    raise exception 'Sessao expirada. Entre novamente para remanejar esta contratacao.';
  end if;

  if target_event_date is null or target_start_time is null then
    raise exception 'Informe uma nova data e um novo horario para remarcacao.';
  end if;

  if target_duration_hours is null or target_duration_hours <= 0 or target_duration_hours > 12 then
    raise exception 'Informe uma duracao valida em horas para a remarcacao.';
  end if;

  if normalized_location_label is null or char_length(normalized_location_label) < 2 then
    raise exception 'Informe uma referencia valida de local para a remarcacao.';
  end if;

  if normalized_reason is null or char_length(normalized_reason) < 8 then
    raise exception 'Descreva um motivo com pelo menos 8 caracteres para remarcacao.';
  end if;

  select
    c.id,
    c.opportunity_id,
    c.status,
    c.venue_id,
    c.artist_id,
    o.event_date,
    o.start_time,
    o.duration_hours,
    o.location_label
  into target_contract
  from public.contracts c
  join public.opportunities o
    on o.id = c.opportunity_id
  where c.id = target_contract_id
    and (
      c.venue_id = current_user_id
      or c.artist_id = current_user_id
    );

  if target_contract is null then
    raise exception 'Nao foi possivel localizar esta contratacao para sua conta.';
  end if;

  if target_contract.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'Somente contratacoes pendentes ou confirmadas podem ser remarcadas.';
  end if;

  if target_contract.event_date = target_event_date
     and target_contract.start_time = target_start_time
     and target_contract.duration_hours = target_duration_hours
     and trim(both from target_contract.location_label) = normalized_location_label then
    raise exception 'Informe pelo menos uma mudanca real para registrar a remarcacao.';
  end if;

  insert into public.contract_schedule_changes (
    contract_id,
    opportunity_id,
    changed_by,
    reason,
    previous_event_date,
    previous_start_time,
    previous_duration_hours,
    previous_location_label,
    new_event_date,
    new_start_time,
    new_duration_hours,
    new_location_label
  )
  values (
    target_contract.id,
    target_contract.opportunity_id,
    current_user_id,
    normalized_reason,
    target_contract.event_date,
    target_contract.start_time,
    target_contract.duration_hours,
    target_contract.location_label,
    target_event_date,
    target_start_time,
    target_duration_hours,
    normalized_location_label
  );

  update public.opportunities
  set
    event_date = target_event_date,
    start_time = target_start_time,
    duration_hours = target_duration_hours,
    location_label = normalized_location_label
  where id = target_contract.opportunity_id;

  update public.contracts
  set
    last_rescheduled_at = timezone('utc', now()),
    last_rescheduled_by = current_user_id,
    last_reschedule_reason = normalized_reason,
    cancelled_at = null,
    cancellation_reason = null,
    cancelled_by = null
  where id = target_contract.id;
end;
$$;

revoke all on function public.reschedule_opportunity_contract(uuid, date, time, integer, text, text) from public;
grant execute on function public.reschedule_opportunity_contract(uuid, date, time, integer, text, text) to authenticated;
