# TASK-045 - Corrigir falha de upload de imagem no Android release

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-012, BKL-014

## Objetivo

Eliminar o erro `Request Network Failed` ao enviar fotos de perfil no Android release, estabilizando a conversao da imagem antes do upload para o Supabase Storage.

## Entregaveis previstos

- ajuste na conversao da imagem para nao depender de `fetch(data:...)`
- upload nativo de midia estabilizado para Bar e Musico
- nova validacao TypeScript e nova publicacao `release` no device

## Entregue

- `mobile/src/features/profiles/profile-media.ts` corrigido para decodificar a imagem com `base64-arraybuffer` em vez de usar `fetch(data:...)`
- dependencia `base64-arraybuffer` adicionada ao app mobile
- fluxo de upload de imagem estabilizado sem depender de `data:` URL no Android release

## Validacao

- `npx.cmd tsc --noEmit`
- nova `release` gerada e publicada no device pela `TASK-046`
