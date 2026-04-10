# TocaAI - Regras Operacionais do Marketplace

Ultima atualizacao: 2026-04-08
Status: baseline operacional para MVP

## Objetivo

Consolidar as regras de negocio que sustentam o fluxo principal do TocaAI:

- publicar vaga
- descobrir artistas ou vagas
- candidatar ou convidar
- conversar
- contratar
- operar agenda
- concluir e avaliar

Este documento fecha a camada minima de regra operacional do MVP. O detalhamento fino das politicas operacionais agora vive em `MARKETPLACE_POLICIES.md`, enquanto itens juridicos e comerciais mais profundos continuam pendentes.

## Papeis do sistema

### Bar

- publica vagas
- busca artistas
- convida diretamente
- seleciona candidato
- confirma cancelamento ou remarcacao
- avalia o Musico apos o evento

### Musico

- completa perfil artistico
- descobre vagas
- se candidata
- aceita ou recusa convite direto
- confirma contratacao
- acompanha agenda
- avalia o Bar apos o evento

## Regras de oportunidade

- uma vaga nasce como `draft` ou `open`
- apenas vagas `open` aceitam candidaturas novas
- uma vaga `closed` ou `cancelled` nao aceita novas candidaturas
- a vaga pode ser recorrente por dias da semana, mas continua sendo uma unica oportunidade operacional ate a camada de ocorrencias ser implementada
- a vaga nao deve voltar automaticamente para `open` quando uma contratacao e cancelada; essa decisao permanece manual do Bar

## Regras de candidatura e convite

- o Musico nao pode se candidatar duas vezes para a mesma vaga
- candidatura espontanea entra como `source = marketplace_apply`
- convite direto entra como `source = direct_invite`
- o Bar pode convidar um Musico a partir do perfil publico dele
- o Musico pode aceitar ou recusar convite direto
- o chat e sempre contextual a uma candidatura ou convite; nao existe chat solto fora de contexto comercial

## Regras de contratacao

- apenas uma candidatura por vaga pode seguir para contratacao ativa
- quando o Bar seleciona um candidato, o contrato nasce como `pending_confirmation`
- quando o Musico confirma, o contrato vira `confirmed`
- ao confirmar, a vaga sai do fluxo aberto e vai para a agenda
- contratos `confirmed` ocupam a agenda do Musico

## Regras de agenda

- agenda do Bar e do Musico lista contratos `pending_confirmation`, `confirmed`, `completed` e `cancelled`
- contratos `completed` e `cancelled` aparecem no historico
- contratos `pending_confirmation` e `confirmed` entram no fluxo ativo
- o Musico ve dias bloqueados com base em contratos ativos

## Regras de cancelamento e remarcacao

- cancelamento exige motivo obrigatorio
- o sistema registra autoria do cancelamento em `cancelled_by`
- remarcacao registra data, horario, duracao, local e motivo
- o historico de remarcacao deve permanecer visivel para os dois lados
- o fluxo atual cobre contratacao tradicional e convite direto
- regra de no-show, multa, reembolso e disputa continua pendente para detalhamento juridico-operacional

## Regras de conclusao e avaliacao

- um evento so fica `completed` quando uma das partes o marca manualmente como concluido
- apenas contratos concluidos liberam avaliacao
- cada lado pode avaliar uma unica vez por contrato
- a avaliacao composta usa:
  - pontualidade
  - qualidade
  - profissionalismo
- a nota agregada do perfil deve ser recalculada a partir dessas avaliacoes

## Regras de reputacao publica

- o Musico ve score e comentarios do Bar no detalhe da vaga
- o Bar ve score e comentarios do Musico no detalhe do candidato e no perfil publico
- comentarios exibidos ao publico precisam vir de contrato concluido
- moderacao editorial de comentarios ofensivos ou disputados ainda nao esta implementada e segue como backlog

## Regras de confianca minima

- perfil completo aumenta confianca, mas nao deve bloquear uso total do app
- chat, candidatura, convite e contratacao precisam estar vinculados a usuario autenticado
- endereco do Bar e localizacao do Musico usam CEP como base de consistencia
- o filtro geografico atual do MVP e por cidade/estado; calculo de distancia real por raio fica para backlog futuro

## Regras de comissao e pagamento

O fluxo de pagamento ainda nao esta implementado no app, mas a direcao de negocio ja esta fixada:

- o pagamento sera processado por Stripe com retencao ate a conclusao do evento
- o valor bruto pago pelo Bar sera dividido entre:
  - repasse do Musico
  - fee da plataforma
- para eventos unicos, a cobranca acompanha a contratacao daquela data
- para eventos recorrentes, a cobranca recomendada e por ocorrencia individual
- cada ocorrencia entra em janela operacional de cobranca em `T-48h`
- em caso de falha de cobranca, o sistema deve retentar e sinalizar risco antes da data

## Itens explicitamente pendentes

- politica juridica de no-show
- regra formal de disputa e estorno
- moderacao de comentarios publicos
- politica de penalidade por cancelamento em cima da hora
- notificacoes push e SLA operacional
- camada real de pagamentos e splits
