# TASK-145 - Adicionar trilha de etapas no Checkout e desabilitar JWT do gateway

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Dar visibilidade real ao ponto de falha do Checkout Stripe e remover o bloqueio do `verify_jwt` no gateway da Edge Function.

## Entregue

- `mobile/src/features/payments/payments.ts`
- trilha compacta de etapas no erro do Checkout
- telemetria de erro com `checkoutTrace`
- `supabase/functions/stripe-create-platform-checkout/index.ts`
- validacao manual do `Bearer` na propria function
- redeploy da function `stripe-create-platform-checkout` com `verify_jwt=false`

## Resultado

O fluxo agora deixa rastros suficientes para identificar em que etapa a abertura do Checkout falhou, e a autenticacao deixou de depender da validacao automatica do gateway da Edge Function.
