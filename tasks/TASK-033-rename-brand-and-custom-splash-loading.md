# TASK-033 - Renomear marca para TocaAI e aplicar splash com loading fake

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Remover referencias visuais e textuais de `PalcoJa`, consolidar a marca `TocaAI` no app e na documentacao, aplicar a nova arte de splash fornecida pelo usuario e incluir uma barra de loading fake de 2 segundos no boot do app.

## Entregaveis previstos

- textos de UI atualizados de `PalcoJa` para `TocaAI`
- referencias documentais atualizadas para a nova marca
- arte de splash incorporada aos assets do projeto
- splash fake em React Native com barra de progresso visual por 2 segundos
- configuracao nativa de splash alinhada ao novo visual

## Entregue

- referencias visuais e textuais de `PalcoJa` removidas das telas do app e substituidas por `TocaAI`
- placeholder de email e mensagens de carregamento alinhados com a marca `TocaAI`
- nota de naming atualizada em `UI_MAP.md`
- nova arte do usuario incorporada como asset versionado em `mobile/assets/images/tocaai-splash.png`
- boot do app atualizado com splash fake de `2` segundos e barra de progresso visual em React Native
- configuracao do Expo e do Android alinhadas para usar fundo escuro e a nova arte de splash

## Validacao

- `npx.cmd tsc --noEmit`
- varredura com `rg` confirmou remocao de `PalcoJa` fora dos registros historicos de task
