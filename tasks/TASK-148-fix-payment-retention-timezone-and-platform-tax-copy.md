# TASK-148 - Corrigir horario da retencao financeira e copy da taxa da plataforma

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Ajustar a superficie de pagamento para refletir corretamente o horario local de liberacao apos o show e tornar a taxa da plataforma mais explicita no app.

## Entregue

- ajuste do calculo de `release_after` em `supabase/functions/_shared/stripe.ts` para considerar o horario local do Brasil antes de persistir o instante em UTC
- migration de backfill em `supabase/migrations/20260409_024_fix_payment_release_after_timezone.sql` para corrigir ocorrencias ja criadas
- troca do label `Fee da plataforma` para `Taxa da plataforma`
- exposicao do percentual diretamente no label do app, derivado do valor bruto e da taxa calculada

## Evidencia remota

- a ocorrencia financeira mais recente passou a registrar `release_after = 2026-04-18 00:00:00+00`
- no contexto local do device, isso corresponde ao fim do show em `17 de abril 21:00`

## Resultado

O fluxo financeiro passou a comunicar melhor dois pontos operacionais importantes: o dinheiro fica retido ate o fim do evento em horario local do Brasil, e a taxa da plataforma aparece explicitamente com percentual no lado do Bar.
