# TASK-135 - Configurar secret do webhook Stripe e envs minimos da plataforma

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Salvar o `whsec_...` do webhook de `Sua conta` no backend da plataforma e fechar a configuracao minima para o fluxo Stripe operar sem hardcode de segredos.

## Escopo

- configurar `STRIPE_PLATFORM_WEBHOOK_SECRET`
- configurar `STRIPE_SECRET_KEY`
- configurar URLs minimas de `Checkout` para sucesso e cancelamento
- registrar o estado real da configuracao em `PAYMENTS.md`

## Validacao tecnica

- o `whsec_...` do endpoint `Sua conta` foi cadastrado manualmente no dashboard do Supabase
- os envs minimos de Stripe da plataforma foram preenchidos manualmente no dashboard do Supabase
- smoke remoto em `POST https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/stripe-platform-webhook` respondeu `400 stripe_webhook_failed` com mensagem de assinatura invalida da Stripe
- isso confirma que o runtime da Edge Function ja enxerga `STRIPE_SECRET_KEY` e `STRIPE_PLATFORM_WEBHOOK_SECRET`, porque a falha ocorreu na validacao da assinatura e nao por env ausente

## Observacoes

- nao persistir valores sensiveis no repositorio
- usar o fluxo operacional validado com `codex exec` quando o MCP do Supabase desta thread estiver stale
- o runtime novo do Codex confirmou que os tools MCP do Supabase disponiveis conseguem consultar e publicar funcoes, mas nao expoem operacao de `set secret`, entao o preenchimento dos envs segue manual no dashboard
