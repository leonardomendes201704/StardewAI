# TASK-076 - Implementar confirmacao de contratacao e agenda simples

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-024, BKL-025

## Objetivo

Criar a fundacao operacional para o Bar selecionar um candidato, o Musico confirmar a contratacao e ambos visualizarem esse estado no app sem depender mais das telas placeholder de agenda.

## Entregue

- migration `20260408_014_contracts_foundation.sql` com `public.contracts` e `contract_status`
- funcoes RPC `public.select_opportunity_candidate_for_contract(uuid)` e `public.confirm_opportunity_contract(uuid)` com `security definer`
- leitura de contratos conectada ao app em `mobile/src/features/contracts/contracts.ts`
- detalhe da vaga do Musico atualizado para exibir estado de contratacao e CTA de confirmacao
- detalhe do candidato no lado do Bar atualizado para selecionar o Musico para contratacao
- home do Musico atualizada para refletir `contratacao pendente` e `show confirmado`
- lista de candidatos do Bar atualizada para refletir selecao/contratacao ativa
- inbox de chat atualizada para usar contexto de contratacao quando existir
- agendas de Bar e Musico deixaram de ser placeholder e passaram a listar contratacoes com atalhos para detalhe e conversa
- atualizacao de `DATA_MODEL.md`, `ARCHITECTURE.md`, `BACKLOG.md` e `TASKS.md`

## Validacao

- `apply_migration` no Supabase com sucesso
- `npx.cmd tsc --noEmit`
- smoke test transacional no Supabase com `ROLLBACK`, comprovando:
  - `contracts.status = confirmed`
  - `opportunity_applications.status = accepted`
  - `opportunities.status = closed`
- consulta SQL final confirmando `public.contracts = 0` apos o `ROLLBACK`

## Observacao

- a agenda simples ja saiu do placeholder e abre detalhe/conversa, mas ainda nao bloqueia datas do Musico nem cobre o ciclo completo de `completed/cancelled`; isso mantem `BKL-025` em progresso
