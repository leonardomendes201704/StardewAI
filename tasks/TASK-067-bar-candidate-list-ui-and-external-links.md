# TASK-067 - Refinar lista de candidatos e links externos do detalhe do Musico

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-020, BKL-029, BKL-033

## Objetivo

Ajustar a experiencia do Bar na lista de candidatos e no detalhe do Musico, removendo ruido visual e tornando os links externos clicaveis com abertura no app correspondente quando disponivel.

## Entregue

- remocao do chip de status na lista de candidatos por vaga
- centralizacao do CTA `Ver candidato`
- links de Instagram e video no detalhe do Musico transformados em acoes clicaveis
- abertura priorizada em app nativo com fallback para URL web
- registro no backlog da pendencia futura de filtro geografico por raio entre Bar e Musico

## Validacao

- `npx.cmd tsc --noEmit`
- inspeção do fluxo de feed confirmou que o marketplace atual ainda nao cruza distancia nem raio de atuacao; apenas prioriza oportunidades pela mesma `UF`

## Observacao

- a implementacao de match geografico bidirecional foi mantida fora desta trilha e consolidada como backlog futuro em `BKL-033`
