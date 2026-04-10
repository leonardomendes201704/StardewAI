create or replace function public.log_telemetry_event(
  p_event_name text,
  p_session_id text,
  p_pathname text default null,
  p_opportunity_id uuid default null,
  p_application_id uuid default null,
  p_contract_id uuid default null,
  p_context jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_id uuid := auth.uid();
  v_account_type public.account_type;
  v_inserted_id uuid;
begin
  if v_account_id is null then
    raise exception 'authentication required to log telemetry';
  end if;

  select accounts.account_type
  into v_account_type
  from public.accounts as accounts
  where accounts.id = v_account_id;

  if v_account_type is null then
    raise exception 'account not found for telemetry actor %', v_account_id;
  end if;

  insert into public.telemetry_events (
    account_id,
    account_type,
    session_id,
    event_name,
    pathname,
    opportunity_id,
    application_id,
    contract_id,
    context
  )
  values (
    v_account_id,
    v_account_type,
    p_session_id,
    p_event_name,
    nullif(trim(both from coalesce(p_pathname, '')), ''),
    p_opportunity_id,
    p_application_id,
    p_contract_id,
    coalesce(p_context, '{}'::jsonb)
  )
  returning id into v_inserted_id;

  return v_inserted_id;
end;
$$;

create or replace function public.log_app_error_event(
  p_source text,
  p_message text,
  p_session_id text default null,
  p_pathname text default null,
  p_severity text default 'error',
  p_stack text default null,
  p_fingerprint text default null,
  p_context jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_id uuid := auth.uid();
  v_account_type public.account_type;
  v_inserted_id uuid;
begin
  if v_account_id is null then
    raise exception 'authentication required to log application errors';
  end if;

  select accounts.account_type
  into v_account_type
  from public.accounts as accounts
  where accounts.id = v_account_id;

  if v_account_type is null then
    raise exception 'account not found for telemetry actor %', v_account_id;
  end if;

  insert into public.app_error_events (
    account_id,
    account_type,
    session_id,
    pathname,
    source,
    severity,
    message,
    stack,
    fingerprint,
    context
  )
  values (
    v_account_id,
    v_account_type,
    nullif(trim(both from coalesce(p_session_id, '')), ''),
    nullif(trim(both from coalesce(p_pathname, '')), ''),
    p_source,
    p_severity,
    p_message,
    p_stack,
    nullif(trim(both from coalesce(p_fingerprint, '')), ''),
    coalesce(p_context, '{}'::jsonb)
  )
  returning id into v_inserted_id;

  return v_inserted_id;
end;
$$;

grant execute on function public.log_telemetry_event(text, text, text, uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.log_app_error_event(text, text, text, text, text, text, text, jsonb) to authenticated;
