# TASK-147 - Homologar Checkout Stripe real e retencao financeira

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Confirmar em uso real que o `Checkout` hospedado da Stripe abre no device, processa um pagamento de teste com sucesso e atualiza a ocorrencia financeira no Supabase via webhook da plataforma.

## Evidencia funcional coletada

- o `Bar` abriu o CTA `Abrir checkout do pagamento` no detalhe do candidato
- o `Checkout` hospedado da Stripe abriu corretamente no device Android
- o pagamento foi concluido em `test mode` com cartao `4242`
- o usuario confirmou a transacao no dashboard da Stripe

## Evidencia remota coletada

- a Edge Function `stripe-create-platform-checkout` respondeu `POST | 200`
- a Edge Function `stripe-platform-webhook` respondeu `POST | 200` para os eventos da Stripe
- a tabela `public.contract_payment_occurrences` passou a registrar a ocorrencia mais recente com:
  - `status = funds_held`
  - `amount_cents = 35000`
  - `platform_fee_cents = 5250`
  - `musician_payout_cents = 29750`
  - `stripe_customer_id = cus_UIvqxpJHlQar1y`
  - `stripe_checkout_session_id` preenchido
  - `stripe_payment_intent_id = pi_3TKK5mK1KRClNlfA1ma0rWE2`
  - `paid_at` preenchido
- a tabela `public.account_payment_profiles` ficou com `stripe_customer_id` persistido para o `Bar`

## Resultado

A primeira cobranca real de teste da plataforma ficou homologada end-to-end: abertura do `Checkout`, pagamento bem-sucedido, webhook recebido e atualizacao do Supabase para `funds_held`. O item ainda nao pode ser encerrado como produto completo porque repasse ao Musico, `Connect Express` e a politica final de `sinal` e `saldo` continuam fora desta etapa.
