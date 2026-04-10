# TASK-095 - Criar viewer local de backlog e tasks para o P.O.

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-040

## Objetivo

Disponibilizar uma interface local em HTML/JS para leitura do `BACKLOG.md` e do `TASKS.md`, com foco em acompanhamento executivo do produto.

## Entregue

- servidor Node sem dependencias externas em `backlog-viewer/server.js`
- pagina local em `backlog-viewer/index.html` com `app.js` e `styles.css`
- parser para backlog e tasks com relacionamento entre `BKL-###` e `TASK-###`
- metricas, filtros e listagem de tasks por item de backlog

## Validacao

- endpoint local `/api/overview` retorna backlog, tasks e resumo consolidado
- pagina renderiza backlog priorizado, status e tasks relacionadas
- execucao independente do app mobile e sem uso de Metro
