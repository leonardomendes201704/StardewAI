# TASK-078 - Remover shows confirmados da lista de vagas do Musico

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-024, BKL-025

## Objetivo

Corrigir a regressao em que uma vaga permanecia visivel no feed do Musico mesmo apos a contratacao ser confirmada, em vez de migrar esse contexto apenas para a agenda.

## Entregue

- ajuste da regra de composicao do feed do Musico em `mobile/src/features/opportunities/opportunities.ts`
- remocao de oportunidades com `contract.status = confirmed` da lista de vagas do Musico
- preservacao apenas de oportunidades com `contract.status = pending_confirmation` no feed para permitir a acao final do Musico
- manutencao do fluxo de contratacao e agenda sem alterar schema nem RPCs do Supabase

## Validacao

- `npx.cmd tsc --noEmit`
- revisao da regra de merge entre vagas abertas, candidaturas e contratos
- confirmacao de que o feed agora rastreia apenas contratos em `pending_confirmation`

## Observacao

- a homologacao funcional final ainda depende do reteste real no aparelho para comprovar que a vaga some do feed e permanece acessivel apenas pela agenda apos `confirmada`
