# TASK-158 - Homologar onboarding Stripe Connect e repasse real

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-031, BKL-039

## Contexto

Depois das correcoes no onboarding `Accounts v2`, no `account_link` e no repasse com `source_transaction`, o fluxo precisava ser validado com dados reais de teste.

## Objetivo

Confirmar end-to-end:

- onboarding do Musico concluido com conta conectada pronta
- capabilities de transferencia e saques ativas
- repasse real criado apos pagamento e conclusao do show

## Evidencias

- `public.account_payment_profiles` com:
  - `stripe_connected_account_id = acct_1TKMvtK1KRFMVRPh`
  - `stripe_connected_account_status = ready`
  - `stripe_transfers_capability_status = active`
  - `stripe_payouts_capability_status = active`
- `public.contract_payment_occurrences` da contratacao `Toque uma pra mim` com:
  - `status = transferred`
  - `stripe_transfer_id = tr_3TKK5mK1KRClNlfA1v9gSNIJ`
  - `transferred_at` preenchido
- logs das Edge Functions com:
  - `stripe-create-musician-connect-onboarding` `POST | 200`
  - `stripe-sync-musician-connect-account` `POST | 200`
  - `stripe-release-musician-payout` `POST | 200`
