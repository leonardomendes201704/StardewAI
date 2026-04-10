# TASK-075 - Homologar chat real entre Bar e Musico no Supabase

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-020, BKL-023

## Objetivo

Confirmar no Supabase que a conversa contextual iniciada no app ficou realmente persistida entre as duas contas.

## Validacao

- `public.opportunity_chat_threads`: `1` thread real persistida
- `public.opportunity_chat_messages`: `2` mensagens reais persistidas
- a thread real esta vinculada a `1` candidatura existente em `public.opportunity_applications`
- houve envio por ambos os lados, com `sender_id` do Musico e do Bar

## Observacao

- esta homologacao tambem fecha a evidência real de candidatura em producao de MVP, pois a thread nasce a partir de `opportunity_applications`
