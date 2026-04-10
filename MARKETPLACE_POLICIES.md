# TocaAI - Politicas Operacionais do Marketplace

Ultima atualizacao: 2026-04-08
Status: baseline operacional detalhado do MVP

## Objetivo

Detalhar as politicas minimas do TocaAI para operacao do marketplace no MVP, complementando `MARKETPLACE_RULES.md` com regras mais finas de:

- cancelamento e remarcacao
- no-show e disputa
- reputacao e moderacao
- sinais de confianca do perfil
- responsabilidades operacionais de Bar e Musico
- pendencias juridicas e comerciais que ainda nao entram no app

## Escopo

Estas politicas descrevem o baseline operacional que o produto ja sustenta ou assume no MVP.

Nao substituem:

- contrato juridico entre as partes
- termos de uso finais
- politica financeira definitiva
- operacao humana de suporte em casos de excecao

## Politica de cancelamento

### Regra ativa no produto

- o cancelamento pode partir de qualquer participante da contratacao
- o fluxo so se aplica a contratos `pending_confirmation` ou `confirmed`
- o motivo e obrigatorio e precisa ter texto minimamente descritivo
- o sistema registra:
  - `cancelled_at`
  - `cancelled_by`
  - `cancellation_reason`
- o cancelamento nao reabre automaticamente a vaga

### Direcao operacional

- o Bar continua responsavel por decidir se reabre a vaga, cria nova oportunidade ou encerra o caso
- o Musico continua responsavel por justificar o cancelamento com clareza suficiente para historico e suporte
- o motivo do cancelamento deve permanecer visivel nas telas de detalhe e agenda historica para as partes envolvidas

### Pendente fora do MVP

- multa por cancelamento em cima da hora
- politica comercial de reembolso e retencao
- classificacao de cancelamento justificado vs injustificado

## Politica de remarcacao

### Regra ativa no produto

- a remarcacao parte de um participante autenticado da contratacao
- o fluxo exige:
  - nova data
  - novo horario
  - nova duracao em horas
  - nova referencia de local
  - motivo
- cada remarcacao grava trilha em `contract_schedule_changes`
- a agenda dos dois lados passa a refletir a nova informacao operacional

### Direcao operacional

- remarcacao deve ser usada quando a contratacao continua valida e o objetivo e apenas ajustar agenda
- o motivo deve explicar contexto suficiente para o outro lado entender o impacto operacional
- o historico de remarcacoes deve permanecer legivel para evitar divergencia de versao

### Pendente fora do MVP

- fluxo de aceite explicito da remarcacao pela contraparte
- SLA de resposta para remarcacoes proximas da data do evento

## Politica de no-show e disputa

### Baseline atual

- o produto ainda nao possui um workflow dedicado de `no-show`
- o ciclo real do MVP hoje distingue apenas:
  - `confirmed`
  - `completed`
  - `cancelled`
- disputas financeiras ou de presenca ainda dependem de tratativa operacional fora do app

### Regra recomendada para operacao manual ate a fase de pagamentos

- se o show nao acontecer, uma das partes registra cancelamento com motivo claro
- se houver divergencia sobre presenca, horario ou entrega, o caso entra em suporte manual
- o chat contextual e o historico de agenda servem como evidencias operacionais minimas

### Pendente fora do MVP

- classificacao formal de `no-show`
- workflow de contestacao
- coleta estruturada de anexos ou provas
- decisao de responsabilidade financeira automatizada

## Politica de reputacao e moderacao

### Regra ativa no produto

- reviews so podem nascer de `contracts` concluidos
- cada lado envia no maximo uma review por contrato
- a review e composta por:
  - pontualidade
  - qualidade
  - profissionalismo
- comentario precisa ter texto minimo para evitar feedback vazio
- depois de salva, a review fica somente leitura no app

### Exibicao publica atual

- media e quantidade de reviews aparecem em contexto de vaga, detalhe de candidato, busca do Bar e agora tambem nos perfis dedicados
- comentarios exibidos publicamente mostram autor, cidade quando disponivel, data e breakdown implicito pela nota composta
- perfis dedicados mostram distribuicao por estrelas e comentarios recentes

### Moderacao basica do MVP

- comentarios so entram em superficie publica se vierem de contrato concluido
- a moderacao editorial ainda e manual e reativa
- conteudo ofensivo, difamatorio ou nitidamente abusivo deve ser tratado por suporte e pode ser ocultado em fase futura

### Pendente fora do MVP

- fila administrativa de moderacao
- bloqueio automatico por termos proibidos
- apelo formal sobre review

## Politica de sinais de confianca no perfil

### Selos basicos ativos

#### Perfil do Bar

- `Perfil completo`
- `Endereco validado por CEP`
- `Fotos do ambiente`
- `Avaliacoes publicas` ou `Historico de shows concluidos`

#### Perfil do Musico

- `Perfil completo`
- `Base validada por CEP`
- `Portfolio visual`
- `Avaliacoes publicas`, `Historico de shows concluidos` ou `Estilos publicados`

### Regra de exibicao

- os selos precisam ser simples, autoexplicativos e derivados de dados objetivos do proprio app
- nenhum selo do MVP depende de validacao documental externa
- ausencia de selo nao bloqueia o uso, mas deve sinalizar maturidade operacional menor
- nas superficies publicas, os sinais de confianca devem usar apenas dados publicos ou derivados de dados publicos, como:
  - campos operacionais preenchidos
  - base geografica publicada
  - portfolio visual publicado
  - reviews publicas existentes
- no MVP, `confianca` nao significa verificacao documental; significa evidencias operacionais observaveis dentro do proprio produto

## Responsabilidades operacionais por lado

### Bar

- manter o perfil da casa atualizado
- publicar vagas com data, horario, duracao, local e expectativa coerentes
- atualizar cancelamento ou remarcacao com motivo claro
- concluir o evento com responsabilidade operacional
- avaliar o Musico apenas apos a experiencia real

### Musico

- manter base geografica, cache, portfolio e estilos atualizados
- nao se candidatar para datas inviaveis
- usar chat contextual para alinhamento objetivo
- registrar cancelamento ou remarcacao com contexto suficiente
- avaliar o Bar somente apos o evento concluido

## Pendencias juridicas e comerciais

- politica final de comissao por contratacao
- politica de cancelamento com impacto financeiro
- no-show com penalidade
- disputa com criterio de arbitragem
- pagamentos via Stripe com retencao e split
- cobranca recorrente por ocorrencia com janela de `48h`

## Direcao de produto

- o MVP continua priorizando rastreabilidade operacional antes da automacao juridico-financeira completa
- sempre que houver conflito entre simplicidade do fluxo e auditabilidade minima, a auditabilidade deve prevalecer
- automacoes futuras de pagamento, notificacao e disputa devem nascer em cima deste baseline, sem reescrever a semantica basica de contrato, agenda e review
