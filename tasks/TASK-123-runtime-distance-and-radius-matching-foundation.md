# TASK-123 - Implementar distancia e raio de atuacao no marketplace

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-033

## Objetivo

Adicionar calculo de distancia e filtros por raio de atuacao no app para melhorar descoberta e relevancia entre Bar e Musico.

## Escopo

- geolocalizacao por `CEP` em runtime
- calculo de distancia por Haversine
- ranking de artistas por proximidade na busca ativa do Bar
- ranking de vagas por proximidade no feed do Musico
- filtros por deslocamento e raio nas superficies do marketplace
- fallback para contexto por cidade/UF quando a geolocalizacao nao estiver disponivel

## Resultado esperado

O app passa a exibir distancia aproximada entre Bar e Musico e permite cortar a descoberta por proximidade e pelo raio informado pelo artista.

## Resultado

Foi criada a camada `mobile/src/shared/lib/geolocation.ts`, que resolve coordenadas por `CEP` em runtime e calcula distancia em quilometros. A busca ativa do Bar passou a ranquear artistas por proximidade, exibir chips de distancia e filtrar por `No raio do artista`, `Ate 25 km` e `Ate 50 km`. O feed do Musico passou a carregar distancia ate a vaga, respeitar o `performance_radius_km` no filtro `No meu raio` e priorizar oportunidades mais proximas. O detalhe publico do artista no lado do Bar tambem passou a expor distancia e se o deslocamento esta dentro do raio informado.
