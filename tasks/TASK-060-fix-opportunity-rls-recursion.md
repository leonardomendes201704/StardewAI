# TASK-060 - Corrigir recursao de RLS em vagas e candidaturas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-018, BKL-019, BKL-020

## Objetivo

Eliminar a recursao infinita entre as policies de `public.opportunities` e `public.opportunity_applications`, restaurando a criacao de vagas e a leitura do marketplace sem quebrar as regras de acesso.

## Entregaveis previstos

- migration `20260408_010_fix_opportunity_policy_recursion.sql`
- helper functions `security definer` em schema `private`
- recriacao das policies sem dependencia circular
- validacao SQL com papel `authenticated`
- atualizacao de `TASKS.md`

## Entregue

- migration `20260408_010_fix_opportunity_policy_recursion.sql`
- helper functions `private.user_owns_opportunity`, `private.user_has_opportunity_application` e `private.opportunity_is_open_for_application`
- policies de `public.opportunities` e `public.opportunity_applications` recriadas sem dependencia circular
- validacao SQL com `set local role authenticated` para fluxo de Bar e Musico
- confirmacao de `rollback` sem lixo persistido
- revisao dos `security advisors` apos a correcao

## Validacao

- consulta em `pg_policies` confirmando uso das helper functions
- smoke test com usuario `bar` inserindo e lendo vaga dentro de transacao com `rollback`
- smoke test com usuario `musician` lendo vagas e inserindo candidatura dentro de transacao com `rollback`
- conferencias finais sem residuos em `public.opportunities` e `public.opportunity_applications`
