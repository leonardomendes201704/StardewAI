# TASK-125 - Homologar distancia e raio de atuacao no device

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-033

## Objetivo

Confirmar no aparelho que a nova camada de distancia e raio de atuacao funciona no feed do Musico, na busca ativa do Bar e no detalhe publico do artista.

## Evidencia funcional

- a busca do Bar passou a exibir distancia em km nos cards dos artistas
- os filtros `No raio do artista`, `Ate 25 km` e `Ate 50 km` foram validados no aparelho
- o detalhe publico do artista passou a mostrar `Distancia da casa` e `Alcance`
- o feed do Musico passou a exibir distancia ate a vaga
- os filtros `No meu raio`, `Ate 25 km` e `Ate 50 km` foram validados no aparelho
- o fallback por cidade/UF permaneceu funcional quando necessario

## Resultado

Com a homologacao funcional confirmada no device, o item `BKL-033` ficou apto para encerramento formal no backlog.
