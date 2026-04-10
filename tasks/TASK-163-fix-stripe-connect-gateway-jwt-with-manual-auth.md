# TASK-163 - Corrigir gateway JWT das functions Stripe Connect com auth manual

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Eliminar a falha `Invalid JWT` ao abrir o onboarding Stripe de um novo Musico, mantendo a autenticacao real da operacao dentro da propria function.

## Evidencia tecnica

- republicadas com `verify_jwt = false`:
  - `stripe-create-musician-connect-onboarding`
  - `stripe-sync-musician-connect-account`
  - `stripe-release-musician-payout`
- as tres functions ja validam o `Authorization: Bearer ...` manualmente com `auth.getUser(accessToken)` via client admin
- o ajuste espelha a estrategia que ja havia sido validada anteriormente na trilha de Checkout da plataforma

## Resultado

O gateway do Supabase deixa de rejeitar a chamada antes da autenticacao de negocio. O proximo passo e retestar `Configurar recebimento` com o novo Musico no app.
