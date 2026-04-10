# TASK-153 - Corrigir payload de account link v2 no onboarding Stripe

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-031, BKL-039

## Contexto

Depois da correcao de capabilities e do formato do `include`, a Stripe passou a rejeitar a criacao do account link com:

- `return_url: unknown field`
- `use_case.account_onboarding.refresh_url: required request field missing`

Pela API v2, `refresh_url` e `return_url` devem ficar dentro de `use_case.account_onboarding`.

## Objetivo

Corrigir o payload enviado para `POST /v2/core/account_links`, republicar a function e liberar novo reteste do CTA `Configurar recebimento`.

## Entregaveis

- Ajuste do payload do account link v2
- Redeploy da function `stripe-create-musician-connect-onboarding`
- Confirmacao operacional para novo reteste no app

## Evidencias

- Payload do `POST /v2/core/account_links` ajustado para mover `refresh_url` e `return_url` para `use_case.account_onboarding`
- Function `stripe-create-musician-connect-onboarding` republicada no Supabase como `version 4`
- Fluxo liberado para novo reteste no app sem depender de mudanca manual no dashboard da Stripe
