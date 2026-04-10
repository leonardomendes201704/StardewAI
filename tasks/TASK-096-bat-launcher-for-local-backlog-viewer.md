# TASK-096 - Criar launcher BAT visivel para o backlog viewer

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-040

## Objetivo

Permitir que o usuario suba o viewer local por um arquivo `.bat`, com terminal visivel para acompanhar logs e interromper a execucao quando quiser.

## Entregue

- launcher `start-backlog-viewer.bat` na raiz do repositorio
- verificacao de `node` instalado antes da subida
- aviso quando a porta ja estiver em uso
- abertura automatica do navegador com a URL local do viewer

## Validacao

- o `.bat` executa `node .\backlog-viewer\server.js` no diretorio correto
- a janela permanece aberta durante a execucao do servidor
- o usuario pode parar com `Ctrl+C` ou fechando a janela do terminal
