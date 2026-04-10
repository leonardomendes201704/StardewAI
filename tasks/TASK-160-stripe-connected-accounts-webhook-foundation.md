# TASK-160 - Implementar webhook Stripe de contas conectadas para sync automatico

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Adicionar uma trilha automatica para receber eventos de contas conectadas da Stripe e sincronizar o status operacional do recebimento do Musico no Supabase.

## Entregue

- nova Edge Function `supabase/functions/stripe-connect-webhook`
- extensao da camada compartilhada em `supabase/functions/_shared/stripe.ts` com:
  - `getConnectWebhookSecret`
  - `findLocalAccountIdByConnectedStripeAccount`
  - `upsertStripeConnectSnapshotForAccount`
- refactor das functions `stripe-create-musician-connect-onboarding`, `stripe-sync-musician-connect-account` e `stripe-release-musician-payout` para reaproveitar o sync centralizado da conta conectada
- suporte prioritario a eventos `v2.core.account*` com payload `thin`
- fallback para eventos snapshot `account.updated`, `payout.paid` e `payout.failed`

## Resultado

O projeto passou a ter uma trilha backend pronta para sincronizar automaticamente o estado de `Connect` do Musico quando a Stripe disparar eventos de conta conectada, reduzindo a dependencia exclusiva do botao manual `Atualizar status`.
