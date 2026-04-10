# TASK-019 - Corrigir confirmacao de email com deep link nativo

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-010

## Objetivo

Corrigir o fluxo de confirmacao de cadastro por email para o app mobile standalone, eliminando o redirecionamento indevido para `localhost` e tratando o callback no app via deep link.

## Entregaveis previstos

- callback de auth no app para receber tokens da URL
- `emailRedirectTo` configurado no signup e no reenvio de confirmacao
- instrucao objetiva para alinhar `Site URL` e `Redirect URLs` no painel do Supabase

## Entregue

- helper de deep link nativo criado em `mobile/src/features/auth/deep-link.ts`
- `AuthProvider` atualizado para consumir callback de `auth/callback`, criar sessao com `setSession` e expor erro de confirmacao
- rota `mobile/app/auth/callback.tsx` criada para receber o redirecionamento do email dentro do app
- fluxo de cadastro e reenvio em `mobile/app/auth/email.tsx` atualizado com `emailRedirectTo`
- UX ajustada para orientar que o email de confirmacao seja aberto no aparelho com o app instalado

## Validacao

- `npx tsc --noEmit`

## Observacao

O link antigo para `localhost:3000` continuara invalido. Para que os proximos emails saiam corretos, o painel do Supabase ainda precisa receber a configuracao de URL nativa do app.
