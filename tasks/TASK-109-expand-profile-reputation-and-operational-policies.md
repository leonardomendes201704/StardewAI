# TASK-109 - Expandir reputacao dedicada dos perfis e consolidar politicas operacionais

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-004
- BKL-015
- BKL-026
- BKL-029

## Objetivo

Fechar a frente de reputacao dedicada nos perfis de Bar e Musico, documentar selos basicos de confianca e consolidar as politicas operacionais finas do marketplace.

## Entregas

- criacao de `mobile/src/features/reputation/profile-reputation.tsx`
- novos hooks:
  - `useVenueProfileReputation`
  - `useArtistProfileReputation`
- novos componentes compartilhados:
  - `ProfileTrustSignalsCard`
  - `ProfileReputationCard`
- integracao dos blocos de reputacao e selos nos perfis:
  - `mobile/app/bar/profile.tsx`
  - `mobile/app/musician/profile.tsx`
- invalidação adicional de cache de reputacao em `mobile/src/features/reviews/reviews.ts`
- criacao de `MARKETPLACE_POLICIES.md`
- atualizacao de:
  - `MARKETPLACE_RULES.md`
  - `USER_FLOWS.md`
  - `ARCHITECTURE.md`
  - `BACKLOG.md`

## Resultado

- `BKL-004` passou a ter artefato operacional dedicado
- `BKL-015` foi fechado com reputacao e selos visiveis nos perfis
- `BKL-029` foi fechado com historico dedicado de comentarios e distribuicao por estrelas nos perfis autenticados
- `BKL-026` ficou formalizado documentalmente e pronto para homologacao funcional final no device
