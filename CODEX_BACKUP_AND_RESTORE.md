# Codex IDE - Backup e Restore

Guia operacional para preservar o estado local do Codex IDE e dos workspaces antes de formatar a maquina.

## O que sera preservado

O backup criado por este projeto inclui, sem exclusoes:

- `C:\Users\devcr\.codex`
- `C:\Leonardo\Labs`

Na pratica, isso cobre:

- sessoes e topicos locais do Codex
- automacoes
- skills e regras
- plugins e cache local do Codex
- bancos locais `sqlite`
- worktrees
- workspaces reais do seu ambiente

## Scripts disponiveis

- [backup-codex-and-workspaces.ps1](backup-codex-and-workspaces.ps1)
- [restore-codex-and-workspaces.ps1](restore-codex-and-workspaces.ps1)

## Regras importantes

- feche completamente o Codex antes do backup
- feche completamente o Codex antes do restore
- guarde o ZIP final em disco externo ou nuvem antes de formatar a maquina
- o ZIP pode ficar grande, porque inclui tudo de `.codex` e `Labs`

## Backup

### Comando padrao

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Leonardo\Labs\TocaAI\backup-codex-and-workspaces.ps1"
```

### Resultado esperado

O script gera um ZIP unico por padrao na `Area de Trabalho`, com nome no formato:

```text
C:\Users\devcr\Desktop\codex-full-backup_YYYY-MM-DD_HH-mm-ss.zip
```

### Usar outra pasta de saida

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Leonardo\Labs\TocaAI\backup-codex-and-workspaces.ps1" -OutputDirectory "D:\Backups"
```

### Ignorar a verificacao de processo aberto

Nao recomendado, mas suportado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Leonardo\Labs\TocaAI\backup-codex-and-workspaces.ps1" -AllowCodexRunning
```

## Restore

### Passo previo

Depois da formatacao:

1. reinstale o Windows
2. reinstale o Codex IDE
3. copie o ZIP de backup para a maquina nova
4. abra o Codex uma vez, se quiser
5. feche o Codex completamente antes do restore

### Restore padrao

Se o ZIP estiver na `Area de Trabalho`, o script pega automaticamente o backup mais recente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Leonardo\Labs\TocaAI\restore-codex-and-workspaces.ps1" -OverwriteExisting
```

### Restore apontando um ZIP especifico

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Leonardo\Labs\TocaAI\restore-codex-and-workspaces.ps1" -ZipPath "D:\Backups\codex-full-backup_2026-04-10_07-30-00.zip" -OverwriteExisting
```

### O que o restore faz

- extrai o ZIP para uma pasta temporaria
- restaura `.codex` para:
  - `C:\Users\devcr\.codex`
- restaura os workspaces para:
  - `C:\Leonardo\Labs`
- por seguranca, exige `-OverwriteExisting` quando os destinos ja existem

## Fluxo recomendado completo

### Antes de formatar

1. feche o Codex IDE
2. rode o script de backup
3. confirme que o ZIP foi gerado
4. copie o ZIP para disco externo ou nuvem

### Depois de formatar

1. reinstale o Codex IDE
2. copie o ZIP de volta para a maquina
3. feche o Codex IDE
4. rode o script de restore com `-OverwriteExisting`
5. abra o Codex IDE

## Observacoes

- se a autenticacao do Codex nao for reaproveitada automaticamente, basta fazer login de novo
- o objetivo do restore e preservar contexto, estrutura local e workspaces, nao garantir token eterno de autenticacao
- se voce mudar o caminho dos workspaces no futuro, pode usar os parametros do script para restaurar em outro destino
