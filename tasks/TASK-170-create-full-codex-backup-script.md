# TASK-170 - Criar script de backup completo do Codex e workspaces

Status: DONE
Inicio: 2026-04-10
Fim: 2026-04-10
Backlog relacionado:

- Processo do projeto

## Objetivo

Criar um script PowerShell versionado no repositório para gerar um ZIP único com a pasta `.codex` do usuário e a raiz de workspaces `C:\Leonardo\Labs`, preservando o estado operacional do Codex antes de uma formatação da máquina.

## Entregue

- script `backup-codex-and-workspaces.ps1`
- verificação opcional de processos do Codex abertos
- geração de um único ZIP sem exclusões nas duas origens principais
- saída parametrizável via `-OutputDirectory`

## Resultado

O projeto agora possui um artefato reutilizável para backup completo do estado local do Codex IDE e dos workspaces principais.
