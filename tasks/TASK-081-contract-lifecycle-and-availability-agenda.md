# TASK-081 - Evoluir agenda com ciclo de contrato e datas ocupadas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-024, BKL-025

## Objetivo

Fechar a fundacao operacional da agenda, cobrindo o ciclo simples de contrato (`pending_confirmation`, `confirmed`, `completed`, `cancelled`) e o bloqueio visual das datas ocupadas do Musico.

## Entregue

- migration `20260408_015_contract_lifecycle_actions.sql` com RPCs `public.complete_opportunity_contract(uuid)` e `public.cancel_opportunity_contract(uuid)`
- hooks e regras compartilhadas de agenda em `mobile/src/features/contracts/contracts.ts`
- detalhe da vaga do Musico com acoes de concluir e cancelar contratacao
- detalhe do candidato no lado do Bar com acoes de concluir e cancelar contratacao
- agenda do Musico refeita com:
  - bloco visual de `21` dias com datas `livres` e `ocupadas`
  - separacao entre `Fluxo ativo` e `Historico`
  - metricas de pendentes, confirmados, concluidos e cancelados
- agenda do Bar refeita com separacao entre `Fluxo ativo` e `Historico`

## Validacao

- `apply_migration` no Supabase com sucesso
- `npx.cmd tsc --noEmit`
- revisao funcional do feed do Musico para manter shows confirmados fora da lista de vagas e dentro da agenda

## Observacao

- a implementacao ficou pronta e publicada, mas o fechamento de `BKL-025` ainda depende de homologacao funcional no aparelho para validar o comportamento dos novos estados e das datas ocupadas
