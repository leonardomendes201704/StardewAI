# TASK-016 - Configurar camada de dados e sessao persistida

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-007, BKL-009, BKL-010

## Objetivo

Implementar a fundacao de dados do app com Supabase, Query e estado persistido, conectando o onboarding ao fluxo de autenticacao e sessao local.

## Entregaveis previstos

- cliente Supabase configurado para Expo com persistencia local
- Query provider e estado global persistido
- escolha de tipo de conta persistida entre aberturas do app
- fluxo base de login e cadastro por email
- roteamento inicial reagindo ao estado de sessao e ao papel escolhido

## Entregue

- cliente Supabase configurado para Expo em `mobile/src/shared/api/supabase/client.ts`
- env local documentado em `mobile/.env.example` e preenchido em `mobile/.env.local`
- `QueryClientProvider` e `AuthProvider` adicionados ao shell em `mobile/app/_layout.tsx`
- store persistido com Zustand para tipo de conta em `mobile/src/features/session/session-store.ts`
- `AuthGate` protegendo rotas e redirecionando por papel em `mobile/src/features/auth/auth-gate.tsx`
- onboarding ligado ao fluxo de auth em `mobile/app/index.tsx`
- tela de login/cadastro por email em `mobile/app/auth/email.tsx`
- saida de conta disponivel em `mobile/app/bar/profile.tsx` e `mobile/app/musician/profile.tsx`

## Validacao

- `npx tsc --noEmit`

## Observacao

Esta task fecha a fundacao tecnica para onboarding real, autenticacao e sessao persistida. A homologacao funcional em device ainda deve confirmar o fluxo real de criar conta, entrar e reabrir o app com sessao mantida.
