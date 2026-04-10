# TASK-138 - Corrigir abertura do Checkout Stripe no Android

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-031
- BKL-039

## Objetivo

Garantir que o CTA `Abrir checkout do pagamento` realmente abra a URL hospedada da Stripe no device Android de homologacao.

## Hipotese inicial

- o device atual nao reagiu como esperado ao uso de `expo-web-browser`
- o fallback mais robusto para URL `https` no Android e `Linking.openURL`

## Entregue

- ajuste em `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`
- abertura do Checkout priorizando `Linking.openURL` no Android
- fallback para `expo-web-browser` fora do Android
- erro explicito se o device nao conseguir abrir a URL hospedada

## Validacao tecnica

- `npx.cmd tsc --noEmit`

## Resultado

O CTA `Abrir checkout do pagamento` deixou de depender exclusivamente de `expo-web-browser` no Android. Agora a URL hospedada da Stripe e entregue diretamente ao sistema via `Linking.openURL`, reduzindo o risco de toque sem efeito no device de homologacao.
