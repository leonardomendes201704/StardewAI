update public.contract_payment_occurrences as cpo
set release_after = (
  (
    cpo.occurrence_date::timestamp
    + o.start_time
    + make_interval(hours => o.duration_hours)
  ) at time zone 'America/Sao_Paulo'
)
from public.opportunities as o
where o.id = cpo.opportunity_id
  and cpo.charge_kind = 'single_event';
