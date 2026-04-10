# TASK-171 - Criar script de restore do Codex e documento de backup/restore

Status: DONE
Inicio: 2026-04-10
Fim: 2026-04-10
Backlog relacionado:

- Processo do projeto

## Objetivo

Complementar a trilha de backup do Codex com um script de restore e um documento unico de operacao para backup e restauracao.

## Entregue

- script `restore-codex-and-workspaces.ps1`
- documento `CODEX_BACKUP_AND_RESTORE.md`
- instrucoes de execucao padrao e com parametros
- restore seguro por padrao, exigindo `-OverwriteExisting` quando os destinos ja existem

## Resultado

O repositório agora possui uma trilha completa de backup e restore para o estado local do Codex IDE e dos workspaces principais.
