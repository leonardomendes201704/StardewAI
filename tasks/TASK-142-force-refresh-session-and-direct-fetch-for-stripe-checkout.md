# TASK-142 - Forcar refresh de sessao e fetch direto no Checkout Stripe

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Eliminar o erro `Invalid JWT` ao abrir o Checkout Stripe no app mobile.

## Entregue

- `mobile/src/features/payments/payments.ts`
- refresh explicito da sessao antes da abertura do Checkout
- troca de `supabase.functions.invoke(...)` por `fetch` direto na URL da Edge Function
- envio manual de `apikey` e `Authorization: Bearer ...`
- leitura da mensagem real do backend em respostas HTTP nao-2xx

## Diagnostico

- apos o primeiro ajuste de auth, a tela passou a exibir `Invalid JWT`
- isso indicou que o request chegava na borda da function, mas o token ainda podia sair stale do fluxo mobile
- como o restante do app seguia autenticado em PostgREST/RLS, o caminho mais robusto foi forcar refresh e controlar a chamada HTTP integralmente

## Resultado

O fluxo de Checkout Stripe agora renova a sessao antes da chamada e envia manualmente os headers necessarios para a Edge Function. Isso reduz a dependencia do comportamento interno de `functions.invoke(...)` no runtime React Native.
