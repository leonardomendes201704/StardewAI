# TASK-039 - Remover tela textual de carregamento nos perfis e callback

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Eliminar a tela full-screen com a string `TocaAI` que ainda aparece apos a splash quando o app reabre direto em telas de perfil ou no callback de autenticacao.

## Entregaveis previstos

- estados de carregamento silenciosos nas telas de perfil de Bar e Musico
- callback de auth sem titulo textual `TocaAI`
- nova `release` para validar a sequencia de abertura no device

## Entregue

- `mobile/app/musician/profile.tsx` passou a usar um scaffold silencioso da propria tela enquanto o perfil carrega, sem `LoadingScreen` full-screen
- `mobile/app/bar/profile.tsx` recebeu o mesmo tratamento, com placeholders estruturais em vez de titulo centralizado
- `mobile/app/auth/callback.tsx` deixou de exibir `TocaAI` como titulo durante a confirmacao

## Validacao

- `npx.cmd tsc --noEmit`
- busca por `title="TocaAI"` no runtime confirmou remocao dos carregamentos full-screen dos perfis
