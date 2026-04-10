# TASK-155 - Expor CTA de repasse quando o pagamento ainda estiver retido

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-031, BKL-039

## Contexto

No detalhe da vaga do Musico, o CTA `Tentar liberar repasse` estava condicionado apenas a `transfer_pending`.

Ao validar o caso real, a ocorrencia paga da contratacao concluida estava em `funds_held`, entao o botao nao aparecia mesmo com a conta Stripe do Musico pronta para receber.

## Objetivo

Ajustar a UI do detalhe da vaga para expor a acao de repasse tanto em `funds_held` quanto em `transfer_pending`, mantendo a leitura financeira coerente para o Musico.

## Entregaveis

- Correcao da condicao de exibicao do CTA de repasse
- Ajuste de copy financeira para orientar melhor o Musico
- Build release publicada no device de homologacao

## Evidencias

- Ocorrencia financeira real validada no banco com `payment_status = funds_held` para contrato concluido
- CTA de repasse exposto no detalhe da vaga do Musico para `funds_held` e `transfer_pending`
- Copy financeira do Musico ajustada para explicar liberacao do repasse apos conclusao do show
