# TASK-133 - Implementar fundacao Stripe da plataforma para pagamentos

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Criar a primeira camada de pagamentos do TocaAI usando Stripe no modelo de plataforma, sem depender ainda de contas conectadas.

## Entregue

- migration `supabase/migrations/20260409_023_stripe_platform_payment_foundation.sql`
- tabela `public.account_payment_profiles`
- tabela `public.contract_payment_occurrences`
- configuracao local de funcao publica em `supabase/config.toml`
- Edge Function autenticada `supabase/functions/stripe-create-platform-checkout`
- Edge Function publica `supabase/functions/stripe-platform-webhook`
- documentacao operacional em `PAYMENTS.md`

## Resultado

A fundacao agora suporta:

- modelagem por ocorrencia para eventos unicos e recorrentes
- retencao do valor na plataforma com fee e payout calculados por ocorrencia
- abertura de Stripe Checkout pelo Bar via Edge Function autenticada
- recepcao de eventos da Stripe via webhook publico da plataforma

O escopo desta task ficou intencionalmente limitado a `Sua conta`. Contas conectadas do Musico, transferencias e split operacional de `sinal` e `saldo` continuam para a trilha seguinte.
