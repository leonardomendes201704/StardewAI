# TASK-154 - Corrigir configurations do account link Stripe Connect

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-031, BKL-039

## Contexto

Depois das correcoes anteriores, a Stripe passou a retornar:

`You must correctly specify the applied configurations on the account in order to use v2/core/account_links`

Na API v2, o onboarding da conta deve declarar em `use_case.account_onboarding.configurations` exatamente as configuracoes aplicadas na conta conectada.

## Objetivo

Ajustar o `account_link` para incluir as configuracoes corretas do onboarding da conta conectada do Musico.

## Entregaveis

- Ajuste do payload `use_case.account_onboarding.configurations`
- Redeploy da function `stripe-create-musician-connect-onboarding`
- Evidencia documental do alinhamento com a Stripe

## Evidencias

- `use_case.account_onboarding.configurations` ajustado para `['merchant', 'recipient']`
- Function `stripe-create-musician-connect-onboarding` republicada no Supabase como `version 5`
- Fluxo liberado para novo reteste do CTA `Configurar recebimento`
