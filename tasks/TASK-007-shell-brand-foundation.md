# TASK-007 - Substituir template do Expo por shell inicial do TocaAI

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-006

## Objetivo

Remover o boilerplate generico do template Expo e deixar uma fundacao visual e estrutural coerente com o produto TocaAI.

## Entregaveis

- renomeacao do app para `TocaAI`
- definicao de `slug`, `scheme` e package id `com.tocaai.app`
- tabs iniciais `Bar` e `Musico`
- paleta base em `mobile/constants/Colors.ts`
- telas placeholder alinhadas ao contexto do marketplace
- modal de contexto do projeto
- pasta `mobile/src/` reservada para modulos futuros
- instalacao de `expo-system-ui`
- remocao do repositorio Git interno gerado pelo scaffold

## Resultado

O app deixou de ser um template generico e passou a ter uma shell inicial consistente com o dominio do produto e com a arquitetura proposta.
