# TASK-164 - Homologar onboarding Stripe Connect do segundo Musico apos fix de JWT

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Confirmar que o ajuste de `verify_jwt = false` nas functions de Connect eliminou a falha `Invalid JWT` e permitiu concluir o onboarding Stripe de um novo Musico em ambiente real de teste.

## Evidencia tecnica

- novo Musico validado: `encontrosnocaminho@gmail.com`
- `stripe-create-musician-connect-onboarding` executando com `POST | 200`
- `stripe-sync-musician-connect-account` executando com `POST | 200`
- `public.account_payment_profiles` com:
  - `stripe_connected_account_id` preenchido
  - `stripe_connected_account_status = ready`
  - `stripe_transfers_capability_status = active`
  - `stripe_payouts_capability_status = active`
  - `stripe_onboarding_completed_at` preenchido

## Resultado

O fluxo de onboarding Stripe Connect voltou a operar para novas contas de Musico sem depender de workarounds no app. A correção do gateway JWT ficou homologada em uso real.
