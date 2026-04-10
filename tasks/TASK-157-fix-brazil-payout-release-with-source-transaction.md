# TASK-157 - Corrigir repasse Stripe no Brasil com source_transaction

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-031, BKL-039

## Contexto

Ao tentar liberar o repasse para o Musico apos um pagamento real homologado, a Stripe retornou:

`For transfers involving Brazil, the source_transaction parameter is mandatory.`

O fluxo atual do TocaAI usa `separate charges and transfers`, entao o repasse precisa referenciar a charge original do pagamento antes de criar o `transfer`.

## Objetivo

Corrigir a function `stripe-release-musician-payout` para recuperar a charge do PaymentIntent e criar o transfer com `source_transaction`.

## Entregaveis

- Ajuste do backend de repasse para usar `source_transaction`
- Redeploy da function `stripe-release-musician-payout`
- Documentacao operacional da regra de repasse Brasil/Stripe

## Evidencias

- Backend de repasse ajustado para usar `source_transaction` em transfers envolvendo Brasil
- Function `stripe-release-musician-payout` republicada no Supabase como `version 3`
- Tentativa seguinte de repasse respondeu `POST | 200` no log da Edge Function
