# TASK-166 - Implementar fundacao de notificacoes push do marketplace

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-032

## Objetivo

Criar a base mobile e Supabase para notificacoes push do marketplace, incluindo preferencias por conta, registro de tokens e dispatch remoto para os eventos mais criticos do fluxo.

## Entregue

- nova migration `supabase/migrations/20260409_026_push_notifications_foundation.sql`
- tabelas `account_notification_preferences`, `account_push_registrations` e `push_notification_deliveries`
- RPC `public.upsert_account_push_registration(...)`
- nova Edge Function `supabase/functions/marketplace-push-dispatch`
- novo runtime mobile:
  - `mobile/src/features/notifications/notifications.ts`
  - `mobile/src/features/notifications/notifications-provider.tsx`
  - `mobile/src/features/notifications/notification-preferences-card.tsx`
- integracao da secao `Notificacoes push` nos perfis de Bar e Musico
- disparo remoto inicial conectado aos eventos:
  - candidatura
  - convite direto
  - mensagem de chat
  - confirmacao de contratacao

## Evidencia tecnica

- migration aplicada com sucesso no Supabase
- Edge Function `marketplace-push-dispatch` publicada com `verify_jwt = false`
- smoke remoto do endpoint retornando `405 method_not_allowed` em `GET`
- TypeScript do app validado com `npx.cmd tsc --noEmit`

## Resultado

A fundacao de push do marketplace passou a existir de ponta a ponta. O que ainda falta e a homologacao real no device para permissao, sincronizacao de token e recebimento de pelo menos um push remoto.
