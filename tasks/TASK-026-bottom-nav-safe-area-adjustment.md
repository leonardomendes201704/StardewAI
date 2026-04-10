# TASK-026 - Ajustar bottom nav para safe area e botoes virtuais do Android

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-005, BKL-013

## Objetivo

Corrigir a barra inferior compartilhada para evitar conflito visual e funcional com os botoes virtuais do dispositivo Android.

## Entregaveis previstos

- bottom nav respeitando o safe area inferior
- offset compartilhado para acoes fixas acima da barra inferior
- ajuste da tela de perfil do Musico para acompanhar a nova posicao da nav
- validacao local antes de gerar nova `release`

## Entregue

- `mobile/src/shared/components/navigation.tsx` passou a calcular offset inferior via safe area
- a bottom nav agora sobe acima dos botoes virtuais em Android com navegacao classica
- foi criado um helper compartilhado para posicionar acoes fixas acima da nav
- `mobile/app/musician/profile.tsx` passou a usar o offset compartilhado para o CTA de salvar

## Validacao

- `npx.cmd tsc --noEmit`
