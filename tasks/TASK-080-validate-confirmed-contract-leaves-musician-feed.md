# TASK-080 - Homologar saida do feed apos contratacao confirmada

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-024, BKL-025

## Objetivo

Confirmar em homologacao real que uma vaga sai da lista de vagas do Musico depois que a contratacao e confirmada, permanecendo apenas na agenda.

## Entregue

- validacao funcional da correcao aplicada em `mobile/src/features/opportunities/opportunities.ts`
- comprovacao de que vagas com `contract.status = confirmed` nao aparecem mais no feed do Musico
- comprovacao de que o evento contratado continua acessivel na agenda

## Validacao

- reteste real no device Android apos a publicacao da build de `TASK-079`
- usuario confirmou que a vaga sumiu da lista de vagas do perfil Musico
- usuario confirmou que o evento permaneceu visivel na agenda
