# TASK-041 - Implementar CEP obrigatorio com ViaCEP no perfil do Bar

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-012

## Objetivo

Migrar o perfil do Bar para o mesmo fluxo orientado por `CEP`, resolvendo automaticamente `logradouro`, `bairro`, `cidade` e `UF` pelo ViaCEP e deixando editaveis apenas `numero` e `complemento`.

## Entregaveis previstos

- migration para persistir `postal_code`, `street`, `address_number` e `address_complement` em `venue_profiles`
- formulario de perfil do Bar atualizado para mascarar o `CEP` e travar os campos derivados
- atualizacao do `DATA_MODEL.md` e do backlog com a nova regra de endereco

## Entregue

- migration `supabase/migrations/20260408_003_venue_profiles_postal_code_address_parts.sql` criada e aplicada no projeto Supabase
- `mobile/src/features/profiles/profile-editor.ts` atualizado para carregar e salvar `postal_code`, `street`, `address_number` e `address_complement`, derivando `address_text` automaticamente
- `mobile/app/bar/profile.tsx` convertido para fluxo de `CEP` com mascara, lookup automatico no ViaCEP, `logradouro`, `bairro`, `cidade` e `UF` bloqueados e apenas `numero` e `complemento` editaveis
- `DATA_MODEL.md` atualizado com a nova estrutura do perfil do Bar

## Validacao

- `npx.cmd tsc --noEmit`
- `list_tables` confirmou as novas colunas em `public.venue_profiles`
- `execute_sql` confirmou que a linha atual do Bar permanece preservada e aguardando novo salvamento para preencher os campos derivados
