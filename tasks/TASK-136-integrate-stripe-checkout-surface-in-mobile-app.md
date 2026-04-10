# TASK-136 - Integrar surface de Checkout Stripe no app mobile

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Ligar a fundacao de pagamentos da Stripe a uma superficie real do app, para que o Bar consiga abrir o Checkout hospedado de uma contratacao confirmada e o Musico consiga acompanhar o status financeiro publicado.

## Entregue

- feature mobile `mobile/src/features/payments/payments.ts`
- leitura de ocorrencia financeira por contrato e proxima ocorrencia
- abertura de `stripe-create-platform-checkout` via Edge Function autenticada
- CTA de pagamento no detalhe do candidato para o Bar
- resumo read-only do pagamento no detalhe da vaga para o Musico
- telemetria `payment_checkout_opened`

## Validacao tecnica

- `npx.cmd tsc --noEmit`

## Resultado

O app agora exibe o estado financeiro da proxima ocorrencia da contratacao, incluindo valor bruto, ocorrencia, checkpoint de pagamento e repasse previsto quando disponivel. No lado do Bar, contratos confirmados ou concluidos com cobranca ainda aberta passam a oferecer `Abrir checkout do pagamento` ou `Retomar checkout`. No lado do Musico, o mesmo estado aparece em modo somente leitura para aumentar transparencia operacional.
