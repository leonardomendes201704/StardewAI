# TASK-071 - Implementar chat contextual por candidatura

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-023

## Objetivo

Criar a primeira camada funcional de chat interno entre Bar e Musico, vinculada diretamente a cada candidatura de vaga.

## Entregue

- migration `20260408_013_opportunity_chat_foundation.sql` com `public.opportunity_chat_threads` e `public.opportunity_chat_messages`
- trigger para criar automaticamente `1` thread por candidatura e backfill das candidaturas existentes
- politicas RLS para restringir leitura e envio aos participantes corretos
- inbox compartilhada em `/chat`
- detalhe da conversa em `/chat/application/[applicationId]`
- envio de mensagens de texto com persistencia no Supabase
- atalhos para abrir a conversa a partir do detalhe da vaga do Musico e do detalhe do candidato do Bar
- atualizacao de `DATA_MODEL.md`, `ARCHITECTURE.md`, `BACKLOG.md` e `TASKS.md`

## Validacao

- `apply_migration` no Supabase com sucesso
- `npx.cmd tsc --noEmit`
- consulta SQL confirmando `1` thread backfillada para `1` candidatura real existente

## Observacao

- o refresh atual do chat usa polling curto com `TanStack Query`; a troca para `Supabase Realtime` segue como evolucao tecnica posterior
