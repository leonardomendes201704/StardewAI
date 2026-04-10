# TASK-165 - Registrar ausencia de eventos Account v2 no Dashboard da Stripe em ambiente de teste

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Registrar a limitacao observada na homologacao do webhook automatico de contas conectadas da Stripe para evitar retrabalho e falsas hipoteses em sessoes futuras.

## Evidencia tecnica

- destino `tocaai-connect-accounts-test` configurado com:
  - `Contas conectadas e v2`
  - payload `Mínimo`
  - eventos `v2.core.account.created`, `v2.core.account.updated`, `v2.core.account[requirements].updated`, `v2.core.account[configuration.recipient].capability_status_updated`, `v2.core.account[configuration.merchant].capability_status_updated`
- onboarding real de novos Musicos concluido com sucesso
- `Workbench > Events` nao exibiu nenhum `v2.core.account*`
- `Event deliveries` do destino permaneceu vazio
- `stripe-connect-webhook` segue publicado e com secret validado, mas sem evidencia de entrega real da Stripe nesse fluxo

## Resultado

O sync automatico por webhook de contas conectadas permanece sem homologacao real por ausencia de eventos `Account v2` no Dashboard da Stripe em modo de teste. O fallback operacional do projeto continua sendo o sync manual por `stripe-sync-musician-connect-account`.
