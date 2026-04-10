# TASK-150 - Implementar onboarding Stripe do Musico e fundacao de repasse

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Estender a fundacao de pagamentos para permitir que o Musico conecte sua conta Stripe, acompanhe o status de recebimento e prepare o repasse apos a conclusao do show.

## Entregue

- migration `supabase/migrations/20260409_025_stripe_connect_accounts_and_payout_state.sql` com colunas de conta conectada e status operacional em `account_payment_profiles`
- Edge Functions `stripe-create-musician-connect-onboarding`, `stripe-sync-musician-connect-account` e `stripe-release-musician-payout`
- secao `Recebimento Stripe` no perfil do Musico em `mobile/app/musician/profile.tsx`
- camada mobile em `mobile/src/features/payments/payments.ts` para onboarding, sync e tentativa de repasse
- tentativa automatica de liberar o repasse ao concluir um contrato em `mobile/src/features/contracts/contracts.ts`
- CTA de direcionamento para recebimento Stripe no detalhe da vaga do Musico quando o repasse estiver pendente
- CTA manual `Tentar liberar repasse` no detalhe da vaga para casos em que o show ja foi concluido antes do onboarding Stripe

## Resultado

O projeto passou a ter a trilha base de `Connect`: o Musico consegue iniciar onboarding, sincronizar o status da conta conectada e o backend fica apto a tentar `transfer` depois que o show e marcado como concluido.
