# TASK-159 - Registrar backlog futuro de ganhos do Musico e trilha financeira auditavel

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-042, BKL-043

## Contexto

Depois da homologacao de `Checkout`, `Connect` e primeiro repasse real, surgiu a necessidade de reservar duas frentes futuras sem iniciar implementacao imediata:

- UX de ganhos do Musico no perfil
- base auditavel e analitica para dashboards financeiros

## Objetivo

Materializar essas duas frentes no backlog com escopo separado, criterios de aceite objetivos e direcao tecnica coerente com a arquitetura atual do projeto.

## Resultado

- `BKL-042` criado em `EP08` para a secao `Ganhos com a plataforma` no perfil do Musico
- `BKL-043` criado em `EP08` para a trilha financeira auditavel e base de dashboards
- decisoes principais registradas:
  - `Previstos` e `Real` devem ser liquidos para o Musico
  - a V1 mobile nao tera filtro por periodo
  - a futura aplicacao `.NET` deve ler o Supabase diretamente
  - logs continuam como apoio operacional, nao como fonte principal de BI
