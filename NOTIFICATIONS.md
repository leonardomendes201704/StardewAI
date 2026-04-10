# TocaAI - Notificacoes Push

Ultima atualizacao: 2026-04-09
Status: fundacao P1 implementada

## Objetivo

Centralizar a configuracao e o comportamento das notificacoes push do marketplace para evitar dependencia de memoria oral entre sessoes.

## Escopo atual

Eventos cobertos pela fundacao atual:

- nova candidatura enviada pelo Musico
- convite direto enviado pelo Bar
- nova mensagem no chat contextual
- confirmacao de contratacao

Eventos ainda fora desta primeira entrega:

- broadcast de novas vagas abertas
- lembretes operacionais com push remoto
- automacoes de pagamento e repasse

## Camada mobile

Arquivos principais:

- `mobile/src/features/notifications/notifications.ts`
- `mobile/src/features/notifications/notifications-provider.tsx`
- `mobile/src/features/notifications/notification-preferences-card.tsx`
- `mobile/app/_layout.tsx`
- `mobile/app/bar/profile.tsx`
- `mobile/app/musician/profile.tsx`

Responsabilidades:

- pedir permissao do sistema
- registrar token Expo por instalacao
- persistir preferencias por conta
- receber notificacoes em foreground
- abrir a rota correta quando o usuario toca na notificacao

## Camada Supabase

Migration:

- `supabase/migrations/20260409_026_push_notifications_foundation.sql`

Estruturas criadas:

- `public.account_notification_preferences`
- `public.account_push_registrations`
- `public.push_notification_deliveries`
- `public.upsert_account_push_registration(...)`

## Edge Function

Function publicada:

- `supabase/functions/marketplace-push-dispatch/index.ts`

URL:

- `https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/marketplace-push-dispatch`

Comportamento:

- valida o usuario remetente por `Authorization: Bearer ...`
- resolve o destinatario real pelo banco
- respeita preferencias por categoria
- envia para a Expo Push API
- grava o resultado em `push_notification_deliveries`
- desabilita automaticamente registrations invalidados com `DeviceNotRegistered`

## Preferencias por conta

Categorias expostas hoje:

### Bar

- novas candidaturas
- mensagens do chat
- contratacoes e confirmacoes
- pagamentos

### Musico

- convites diretos
- mensagens do chat
- contratacoes e confirmacoes
- pagamentos e repasses

Observacao:

- a primeira fundacao do dispatcher remoto cobre application, invite, chat e contract confirmation
- a categoria de pagamentos ja esta prevista na preferencia, mas ainda nao tem evento push remoto dedicado nesta etapa

## Contrato de ambiente

Variaveis mobile:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_EXPO_PROJECT_ID`

Observacao operacional:

- se `EXPO_PUBLIC_EXPO_PROJECT_ID` ou as credenciais Expo/FCM nao estiverem prontas, o app pode falhar ao obter o token real de push
- nesse caso, o erro deve aparecer explicitamente no card de preferencias, sem quebrar auth, home, agenda, chat ou perfis

## Validacao recomendada

1. Abrir o perfil do Bar e do Musico.
2. Confirmar a secao `Notificacoes push`.
3. Tocar em `Ativar no dispositivo`.
4. Confirmar o status de permissao e sincronizacao.
5. Disparar pelo menos um evento real:
   - candidatura
   - convite direto
   - mensagem de chat
   - confirmacao de contratacao
6. Conferir no banco se surgiu linha em `push_notification_deliveries`.

## Limitacoes conhecidas

- a obtencao do token depende do runtime Expo nativo estar corretamente configurado
- nao existe ainda broadcast de novas vagas
- nao existe ainda painel analitico dedicado para push
