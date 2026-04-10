# TASK-162 - Registrar secret do webhook Stripe Connect e validar leitura do runtime

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Confirmar que o `STRIPE_CONNECT_WEBHOOK_SECRET` foi cadastrado no Supabase e que a Edge Function de contas conectadas passou a ler o secret corretamente em runtime.

## Evidencia tecnica

- secret `STRIPE_CONNECT_WEBHOOK_SECRET` cadastrado manualmente no Supabase pelo operador
- smoke remoto executado em `POST https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/stripe-connect-webhook`
- resposta obtida: erro real de assinatura invalida da Stripe, o que confirma leitura do secret e validacao ativa do `Stripe-Signature`

## Resultado

O webhook de contas conectadas deixou de depender de configuracao pendente no Supabase. A proxima validacao passa a ser um evento real da Stripe no destino `Contas conectadas e v2`.
