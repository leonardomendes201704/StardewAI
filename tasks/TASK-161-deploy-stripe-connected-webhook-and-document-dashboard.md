# TASK-161 - Publicar webhook Stripe Connect e documentar configuracao do dashboard

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Publicar a nova function de webhook para contas conectadas, alinhar os runtimes refatorados e registrar a configuracao exata do dashboard da Stripe para a proxima homologacao.

## Evidencia tecnica

- function `stripe-connect-webhook` publicada no Supabase com `verify_jwt = false`
- functions refatoradas republicadas:
  - `stripe-create-musician-connect-onboarding`
  - `stripe-sync-musician-connect-account`
  - `stripe-release-musician-payout`
- smoke remoto do endpoint `https://fbbhnvjvfukmrbsmeici.supabase.co/functions/v1/stripe-connect-webhook` respondendo `405 method_not_allowed` em `GET`, o que confirma endpoint online e restrito a `POST`
- documentacao atualizada em `PAYMENTS.md`, `BACKLOG.md` e `TASKS.md`

## Resultado

O backend de contas conectadas ficou publicado e alinhado ao repositorio. O proximo passo operacional ficou restrito ao dashboard da Stripe: criar o destino `Contas conectadas e v2`, gerar o novo `whsec_...` e cadastrar esse secret no Supabase.
