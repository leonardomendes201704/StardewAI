# TASK-012 - Adicionar Supabase MCP na configuracao global do Codex

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-003

## Objetivo

Habilitar o MCP HTTP do Supabase no ambiente global do Codex para permitir integracao assistida com projetos Supabase nas proximas sessoes.

## Entregaveis

- backup local do `config.toml`
- adicao de `mcp_servers.supabase` em `C:\Users\devcr\.codex\config.toml`
- registro no projeto de que a ativacao operacional depende de reabrir a sessao e autenticar no Supabase

## Configuracao aplicada

```toml
[mcp_servers.supabase]
type = "http"
url = "https://mcp.supabase.com/mcp"
```

## Observacao

A configuracao foi gravada, mas a sessao atual ainda nao passa a expor automaticamente as tools do Supabase. Para uso efetivo, o cliente Codex precisa recarregar a configuracao e concluir o login OAuth quando solicitado.

