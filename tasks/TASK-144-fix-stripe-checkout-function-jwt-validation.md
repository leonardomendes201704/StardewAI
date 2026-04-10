# TASK-144 - Corrigir validacao de JWT na function do Checkout Stripe

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Eliminar o erro `Invalid JWT` na Edge Function `stripe-create-platform-checkout`.

## Diagnostico

- o app ja havia passado a enviar `Bearer` e `apikey` explicitamente
- mesmo assim, a function continuava respondendo `401`
- o ponto fragil era a identificacao do usuario dentro da function, baseada em um client de usuario sem sessao explicita

## Entregue

- ajuste em `supabase/functions/stripe-create-platform-checkout/index.ts`
- extracao explicita do token `Bearer`
- validacao do usuario via `createAdminClient().auth.getUser(accessToken)`
- redeploy da function no projeto Supabase

## Resultado

A function `stripe-create-platform-checkout` foi publicada na `version 3` com validacao de JWT mais robusta e sem depender de estado de sessao interno do client Supabase dentro da Edge Function.
