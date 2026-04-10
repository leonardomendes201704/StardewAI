# TocaAI - Fundacao de Pagamentos Stripe

Ultima atualizacao: 2026-04-09
Status: plataforma com Checkout real homologado, Connect/repasse validados e webhook de contas conectadas publicado em test mode

## Objetivo

Documentar a primeira camada de pagamento do TocaAI usando Stripe no modelo de plataforma.

Escopo atual:

- webhook da plataforma em `Sua conta`
- webhook de contas conectadas em `Contas conectadas e v2`
- criacao de Checkout Session hospedada pela Stripe
- modelagem por ocorrencia para eventos unicos e recorrentes
- retencao do valor na plataforma ate conclusao do evento
- onboarding de recebimento Stripe para o Musico
- sincronizacao do status da conta conectada
- tentativa de repasse apos show concluido

Fora do escopo desta etapa:

- split operacional de `sinal` e `saldo`
- automacao recorrente de cobranca em `T-48h`

## Modelo adotado

- cobranca criada na conta da plataforma
- dinheiro retido na plataforma
- repasse ao Musico depende de conta conectada pronta e de show concluido
- eventos recorrentes passam a ter ocorrencias de pagamento independentes

Direcao tecnica:

- Stripe Checkout hospedado para o Bar
- Stripe Webhook como fonte de verdade do status financeiro
- Supabase Edge Functions como backend da integracao
- `Accounts v2` para onboarding do Musico
- tentativa de `transfer` apenas depois da ocorrencia concluida
- para repasses envolvendo Brasil, o `transfer` usa `source_transaction` apontando para a charge original

## Artefatos tecnicos

- migration: `supabase/migrations/20260409_023_stripe_platform_payment_foundation.sql`
- funcao autenticada: `supabase/functions/stripe-create-platform-checkout`
- funcao publica: `supabase/functions/stripe-platform-webhook`
- funcao publica: `supabase/functions/stripe-connect-webhook`
- funcao autenticada: `supabase/functions/stripe-create-musician-connect-onboarding`
- funcao autenticada: `supabase/functions/stripe-sync-musician-connect-account`
- funcao autenticada: `supabase/functions/stripe-release-musician-payout`
- mobile: `mobile/src/features/payments/payments.ts`
- UI Bar: `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`
- UI Musico: `mobile/src/features/opportunities/opportunity-detail-screen.tsx`

Projeto Supabase:

- `https://fbbhnvjvfukmrbsmeici.supabase.co`

Webhook exato de `Sua conta`:

- `https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/stripe-platform-webhook`

Webhook exato de `Contas conectadas e v2`:

- `https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/stripe-connect-webhook`

## Tabelas da fundacao

### `public.account_payment_profiles`

Mantem identidade financeira do Bar na cobranca e a conta conectada do Musico para repasses.

Campos adicionais desta etapa:

- `stripe_connected_account_id`
- `stripe_connected_account_status`
- `stripe_connect_country`
- `stripe_connect_dashboard`
- `stripe_transfers_capability_status`
- `stripe_payouts_capability_status`
- `stripe_requirements_due`
- `stripe_requirements_pending`
- `stripe_requirements_disabled_reason`
- `stripe_onboarding_completed_at`
- `stripe_last_connect_sync_at`
- `stripe_last_payout_attempt_at`

### `public.contract_payment_occurrences`

Representa uma unidade faturavel de uma contratacao.

Campos relevantes:

- `contract_id`
- `occurrence_date`
- `charge_kind`
- `status`
- `amount_cents`
- `platform_fee_cents`
- `musician_payout_cents`
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `stripe_charge_id`
- `stripe_transfer_id`

## Status financeiros desta fase

- `draft`
- `checkout_open`
- `payment_pending`
- `funds_held`
- `transfer_pending`
- `transferred`
- `transfer_reversed`
- `checkout_expired`
- `failed`
- `refunded`
- `cancelled`

## Configuracao Stripe no dashboard

### Destino 1 - Sua conta

Nome sugerido:

- `tocaai-platform-payments-test`

Descricao sugerida:

- `Webhook da plataforma TocaAI para Checkout, cobrancas, refunds e transfers em ambiente de teste.`

Eventos recomendados:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `transfer.created`
- `transfer.reversed`

### Destino 2 - Contas conectadas e v2

Nome sugerido:

- `tocaai-connect-accounts-test`

Descricao sugerida:

- `Webhook do TocaAI para sincronizar onboarding, restricoes e capacidade de recebimento das contas conectadas Stripe em ambiente de teste.`

Configuracao recomendada:

- `Eventos de`: `Contas conectadas e v2`
- `Estilo do conteudo`: `Thin`
- `Versao da API`: manter a versao fixa do endpoint no dashboard

Eventos recomendados:

- `v2.core.account[requirements].updated`
- `v2.core.account[configuration.recipient].capability_status_updated`
- `v2.core.account[configuration.merchant].capability_status_updated`

Observacao:

- a function tambem aceita fallback de eventos snapshot como `account.updated`, `payout.paid` e `payout.failed`, mas o alvo correto desta etapa e o destino `Thin` de `Contas conectadas e v2`

## Variaveis necessarias no Supabase

Configurar nas Edge Functions:

- `STRIPE_SECRET_KEY`
- `STRIPE_PLATFORM_WEBHOOK_SECRET`
- `STRIPE_CONNECT_WEBHOOK_SECRET`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`
- `STRIPE_PLATFORM_FEE_BPS`
- `STRIPE_CONNECT_RETURN_URL` opcional
- `STRIPE_CONNECT_REFRESH_URL` opcional

Observacoes:

- `STRIPE_SECRET_KEY` nunca vai para o app mobile
- `STRIPE_PLATFORM_WEBHOOK_SECRET` e o `whsec_...` gerado pelo endpoint de `Sua conta`
- `STRIPE_CONNECT_WEBHOOK_SECRET` e o `whsec_...` gerado pelo endpoint de `Contas conectadas e v2`
- `STRIPE_CHECKOUT_SUCCESS_URL` e `STRIPE_CHECKOUT_CANCEL_URL` devem ser HTTPS
- `STRIPE_PLATFORM_FEE_BPS` usa basis points. Exemplo: `1500` = `15%`

## Valores operacionais definidos nesta etapa

Para destravar o primeiro ciclo de `Checkout` da plataforma, usar:

- `STRIPE_SECRET_KEY`: a `sk_test_...` da conta Stripe da plataforma
- `STRIPE_PLATFORM_WEBHOOK_SECRET`: o `whsec_...` emitido pelo endpoint de `Sua conta`
- `STRIPE_CONNECT_WEBHOOK_SECRET`: o `whsec_...` emitido pelo endpoint de `Contas conectadas e v2`
- `STRIPE_CHECKOUT_SUCCESS_URL`: `https://tocaai.devcraftstudio.com.br/?payment=success`
- `STRIPE_CHECKOUT_CANCEL_URL`: `https://tocaai.devcraftstudio.com.br/?payment=cancelled`
- `STRIPE_PLATFORM_FEE_BPS`: `1500`

Observacao:

- `1500` foi adotado como valor inicial de trabalho para a taxa da plataforma nesta fase de teste. A politica comercial definitiva de `sinal` e `saldo` continua em aberto em `BKL-031`.

## Passo manual atual no Supabase

O fluxo remoto validado com `codex exec` consegue aplicar migrations, publicar Edge Functions e validar o projeto com MCP, mas nao expoe operacao para gravar secrets de Edge Functions.

Entao, nesta fase, os secrets precisam ser preenchidos manualmente no dashboard do Supabase:

1. abrir `Project Settings > Edge Functions > Secrets`
2. criar ou atualizar as variaveis Stripe acima, incluindo `STRIPE_CONNECT_WEBHOOK_SECRET` quando o destino de contas conectadas for criado
3. salvar
4. reenviar um evento de teste da Stripe ou abrir um `Checkout` real de teste

Estado atual desta etapa:

- os envs minimos ja foram cadastrados manualmente no projeto Supabase
- o webhook da plataforma respondeu com erro real de assinatura invalida da Stripe em um `POST` de smoke, o que confirmou a leitura inicial dos secrets
- o app ja possui superficie real para abrir o `Checkout` no lado do Bar e acompanhar o status financeiro dos dois lados
- no Android, a abertura do `Checkout` foi endurecida para priorizar `Linking.openURL`, reduzindo falhas silenciosas no device de homologacao
- o `invoke` mobile do Checkout tambem foi endurecido para refrescar a sessao e enviar o `Authorization: Bearer ...` explicitamente para a Edge Function
- no runtime React Native, a chamada final do Checkout passou a usar `refreshSession()` seguido de `fetch` direto na URL da Edge Function com `apikey` e `Authorization` controlados manualmente
- o `Checkout` real de teste ja foi homologado com cartao `4242`
- a Stripe registrou a cobranca de `R$ 350,00` com `payment_intent = pi_3TKK5mK1KRClNlfA1ma0rWE2`
- o webhook da plataforma respondeu `POST | 200` para os eventos reais da Stripe
- a tabela `public.contract_payment_occurrences` primeiro foi atualizada para `status = funds_held`
- a divisao financeira persistida ficou:
  - `amount_cents = 35000`
  - `platform_fee_cents = 5250`
  - `musician_payout_cents = 29750`
- a tabela `public.account_payment_profiles` passou a registrar `stripe_customer_id` para o Bar pagador
- o perfil do Musico agora expoe a secao `Recebimento Stripe`, com CTA de onboarding e sincronizacao
- o backend agora possui as functions `stripe-create-musician-connect-onboarding`, `stripe-sync-musician-connect-account` e `stripe-release-musician-payout`
- o backend agora tambem possui a function `stripe-connect-webhook`, publicada para receber eventos de `Contas conectadas e v2`
- as functions de Connect e repasse foram republicadas para compartilhar o sync centralizado da conta conectada via `_shared/stripe.ts`
- ao concluir um show, o app tenta automaticamente liberar o repasse da ocorrencia
- quando o Musico ainda nao estiver pronto para receber, a ocorrencia fica em `transfer_pending` com mensagem operacional
- quando a ocorrencia estiver em `transfer_pending` ou `funds_held`, o detalhe da vaga do Musico passa a expor o CTA de liberacao do repasse
- para contas e repasses envolvendo Brasil, a function `stripe-release-musician-payout` passou a usar `source_transaction`, conforme a exigencia da Stripe para `separate charges and transfers`
- o onboarding Stripe Connect do Musico ja foi homologado com:
  - `stripe_connected_account_status = ready`
  - `stripe_transfers_capability_status = active`
  - `stripe_payouts_capability_status = active`
- depois do ajuste de gateway JWT nas functions de Connect, um segundo Musico real de teste tambem concluiu onboarding com sucesso, novamente chegando em `ready/active`
- o primeiro repasse real em `test mode` ja foi homologado para a contratacao `Toque uma pra mim`, com:
  - `status = transferred`
  - `stripe_transfer_id = tr_3TKK5mK1KRClNlfA1v9gSNIJ`
  - `transferred_at` preenchido
- o endpoint `stripe-connect-webhook` respondeu `405 method_not_allowed` em `GET`, confirmando publicacao ativa e restricao a `POST`
- o destino `Contas conectadas e v2` ja foi criado no dashboard da Stripe
- o secret `STRIPE_CONNECT_WEBHOOK_SECRET` ja foi cadastrado manualmente no Supabase
- um `POST` de smoke no endpoint de contas conectadas retornou erro real de assinatura invalida da Stripe, confirmando que o runtime ja esta lendo e validando o novo secret
- em homologacao real de novos onboardings, o Dashboard da Stripe nao exibiu eventos `v2.core.account*` em `Workbench > Events`, e o `Event deliveries` do destino permaneceu vazio
- por isso, o webhook de contas conectadas segue publicado e pronto, mas ainda sem evidencia de entrega real da Stripe neste fluxo de teste

## Proximos passos

1. tratar o sync manual de Connect como fallback operacional estavel enquanto a Stripe nao expuser entregas reais de `Account v2` nesse fluxo de teste
2. definir a regra comercial definitiva de `sinal` e `saldo`
3. automatizar a cobranca recorrente por ocorrencia em `T-48h`
