# TASK-134 - Publicar funcoes Stripe da plataforma e documentar webhook

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Aplicar a migration de pagamentos no Supabase, publicar as Edge Functions da Stripe e registrar a URL real do webhook de `Sua conta`.

## Validacao tecnica

- migration `20260409_023_stripe_platform_payment_foundation` aplicada com sucesso via `codex exec`
- `stripe-create-platform-checkout` publicada como `ACTIVE` com `verify_jwt=true`
- `stripe-platform-webhook` publicada como `ACTIVE` com `verify_jwt=false`
- smoke remoto por `GET` na URL publica retornando `405` com corpo `method_not_allowed`

## Resultado

Projeto Supabase:

- `https://fbbhnvjvfukmrbsmeici.supabase.co`

Webhook exato de `Sua conta`:

- `https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/stripe-platform-webhook`

Observacao:

- a publicacao remota foi feita pelo fluxo validado de `codex exec` com Supabase MCP, evitando o runtime stale desta thread
- o endpoint ja pode ser cadastrado na Stripe
- depois de criar o destino, ainda sera necessario salvar o `whsec_...` em `STRIPE_PLATFORM_WEBHOOK_SECRET`
