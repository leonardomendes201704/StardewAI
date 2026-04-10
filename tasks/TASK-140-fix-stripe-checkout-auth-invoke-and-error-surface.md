# TASK-140 - Corrigir auth do invoke Stripe Checkout e expor erro real

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Eliminar o `401` na Edge Function de Checkout Stripe no app mobile e parar de exibir o erro generico `Edge Function returned a non-2xx status code`.

## Entregue

- `mobile/src/features/payments/payments.ts`
- refresh do token antes do `functions.invoke(...)`
- envio explicito de `Authorization: Bearer <access_token>`
- parse da mensagem JSON retornada pela Edge Function para feedback real ao usuario
- alinhamento do CTA para abrir Checkout apenas em contratos `confirmed`

## Diagnostico

- `supabase/functions/stripe-create-platform-checkout` estava retornando `401`
- os logs remotos do Supabase confirmaram `POST | 401` no endpoint da function
- o app dependia do envio implicito do token pelo client mobile e convertia a falha em erro generico

## Resultado

O fluxo de abertura do Checkout ficou endurecido para obter sessao valida, refrescar token quando necessario e enviar o `Bearer` explicitamente na chamada da Edge Function. A tela tambem passa a mostrar a mensagem real devolvida pelo backend quando houver nova falha.
