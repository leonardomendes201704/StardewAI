# TASK-152 - Corrigir capabilities do onboarding Stripe Connect do Musico

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-031, BKL-039

## Contexto

Ao iniciar o onboarding Stripe Connect do Musico, a API da Stripe recusou a criacao da conta conectada com o erro:

`The stripe_balance.stripe_transfers capability cannot be requested without the configuration.merchant.capabilities.card_payments capability.`

Isso indica que o payload enviado para `POST /v2/core/accounts` precisa solicitar `configuration.merchant.capabilities.card_payments` junto das capacidades de repasse.

## Objetivo

Corrigir a Edge Function `stripe-create-musician-connect-onboarding`, republicar no Supabase e liberar novo teste do CTA `Configurar recebimento`.

## Entregaveis

- Ajuste do payload de criacao da conta conectada para incluir `card_payments`
- Redeploy da function `stripe-create-musician-connect-onboarding`
- Confirmacao operacional para novo teste no app

## Evidencias

- Payload de criacao da conta conectada ajustado para solicitar `configuration.merchant.capabilities.card_payments`
- Serializacao do `include` corrigida para o formato indexado exigido pela API v2 da Stripe (`include[0]`, `include[1]`, ...)
- Function `stripe-create-musician-connect-onboarding` republicada no Supabase como `version 3`
- Function `stripe-sync-musician-connect-account` republicada no Supabase como `version 2`
- Function `stripe-release-musician-payout` republicada no Supabase como `version 2`
- Fluxo liberado para novo reteste no app sem depender de mudanca manual no dashboard da Stripe
