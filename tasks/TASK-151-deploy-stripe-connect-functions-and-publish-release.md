# TASK-151 - Publicar functions Stripe Connect e release Android da trilha de repasse

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-031
- BKL-039

## Objetivo

Aplicar o novo schema financeiro no Supabase, publicar as Edge Functions de Connect/repasse e instalar a release Android com a superficie de recebimento do Musico.

## Evidencia tecnica

- migration `stripe_connect_accounts_and_payout_state` aplicada com sucesso no Supabase
- functions publicadas:
  - `stripe-create-musician-connect-onboarding`
  - `stripe-sync-musician-connect-account`
  - `stripe-release-musician-payout`
  - `stripe-platform-webhook` republicada
- `npx.cmd tsc --noEmit` executado com sucesso
- release Android gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- build instalada no device de homologacao via ADB Wi-Fi

## Resultado

A trilha de `Connect` ficou operacional no backend e disponivel no app para a proxima rodada de homologacao do onboarding do Musico e do primeiro repasse em `test mode`.
