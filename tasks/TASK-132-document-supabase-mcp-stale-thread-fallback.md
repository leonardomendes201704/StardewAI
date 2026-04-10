# TASK-132 - Documentar fallback do Supabase MCP para thread com auth stale

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- Processo do projeto

## Objetivo

Registrar no `AGENTS.md` a abordagem validada para quando os tools `supabase/*` da thread atual ficarem presos em `Auth required`, apesar de o OAuth global estar correto.

## Escopo

- documentar a checagem via `codex mcp list` e `codex mcp get supabase`
- documentar a interpretacao de cache stale da thread atual
- registrar `codex exec` como fallback padrao para operacoes remotas no Supabase
- deixar um exemplo de comando validado para futuras sessoes

## Resultado

O `AGENTS.md` do projeto agora instrui explicitamente que, se a thread atual do Codex mantiver `Auth required` mas o shell mostrar `Auth = OAuth` para o servidor `supabase`, a operacao deve migrar imediatamente para `codex exec` com MCP do Supabase, sem insistir em retries improdutivos no mesmo runtime da conversa.
