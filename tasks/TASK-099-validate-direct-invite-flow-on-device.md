# TASK-099 - Homologar convite direto do Bar para o Musico no device

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-022

## Objetivo

Confirmar em uso real no aparelho que o fluxo de convite direto parte do perfil publico do Musico, chega ao feed do Musico e atualiza corretamente candidatura, contrato e vaga.

## Entregue

- validacao funcional do fluxo no device:
  - Bar abriu o perfil publico do Musico pela busca
  - Bar enviou convite direto
  - Musico abriu o convite no feed
  - Musico respondeu ao convite
- validacao de persistencia no Supabase por consulta operacional

## Validacao

- consulta operacional ao projeto Supabase via `codex exec` com MCP autenticado
- evidencia real mais recente:
  - vaga `Toque uma pra mim`
  - candidatura em `accepted`
  - contrato associado em `confirmed`
  - oportunidade em `closed`

## Observacao

- como o schema atual nao possui uma coluna explicita `source = direct_invite`, a identificacao do caso foi feita por inferencia operacional coerente com a implementacao: no caso homologado, a candidatura e o contrato nasceram no mesmo instante e depois seguiram para confirmacao pelo Musico, o que coincide com o comportamento da RPC `create_direct_opportunity_invite`
