# Backlog Viewer Local

Viewer local para acompanhamento de backlog e tasks do TocaAI.

## Como subir

No diretorio raiz do projeto:

```powershell
node .\backlog-viewer\server.js
```

Depois abra:

- `http://localhost:3210`

## Porta customizada

```powershell
$env:PORT='4321'
node .\backlog-viewer\server.js
```

O servidor le `BACKLOG.md` e `TASKS.md` em tempo real a cada requisicao.
