# TASK-131 - Publicar release e validar ingestao remota da observabilidade

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-008

## Objetivo

Publicar uma nova build `release` com o fix de ingestao por RPC e comprovar no Supabase que a telemetria esta sendo persistida de verdade.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:38715 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:38715 shell am start -n com.tocaai.app/.MainActivity`
- consulta remota no Supabase via MCP para contar `public.telemetry_events` e listar `event_name`

## Resultado

A build `release` corrigida foi publicada no device `192.168.0.98:38715`, o app foi relancado autenticado na home do Musico e a consulta remota no Supabase passou a mostrar persistencia real em `public.telemetry_events`. No primeiro smoke validado apos a publicacao, o projeto registrou `9` linhas, com eventos `session_restored`, `app_session_started`, `screen_view` e `app_foregrounded`. `public.app_error_events` permaneceu em `0`, o que e coerente com ausencia de falhas durante o smoke.
