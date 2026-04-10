# TASK-112 - Expor sinais minimos de confianca nas superficies publicas do marketplace

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-030

## Objetivo

Levar sinais objetivos de confianca para as superficies publicas de perfil usadas na decisao comercial do marketplace, sem depender de verificacao documental externa.

## Entregas

- extensao de `mobile/src/features/reputation/profile-reputation.tsx` com:
  - `buildPublicBarTrustSignals`
  - `buildPublicMusicianTrustSignals`
- integracao dos sinais no detalhe publico do Musico em:
  - `mobile/src/features/search/bar-artist-detail-screen.tsx`
- integracao dos sinais no detalhe publico do Bar para o Musico em:
  - `mobile/src/features/opportunities/opportunity-detail-screen.tsx`
- integracao dos sinais no detalhe do candidato para o Bar em:
  - `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`
- consolidacao da regra em:
  - `MARKETPLACE_POLICIES.md`
  - `ARCHITECTURE.md`

## Resultado

As superficies publicas mais relevantes do marketplace agora exibem sinais minimos de confianca derivados de dados objetivos ja publicados no produto, preparando o encerramento de `BKL-030` apos homologacao visual no device.
