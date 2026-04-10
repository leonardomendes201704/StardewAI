# TocaAI - User Flows

Ultima atualizacao: 2026-04-08
Status: baseline funcional do MVP

## Objetivo

Descrever os fluxos principais do TocaAI para orientar design, frontend, backend e refinamento do backlog.

Complemento operacional:

- as regras de negocio e operacao associadas a estes fluxos agora estao consolidadas em `MARKETPLACE_RULES.md`
- as politicas operacionais finas e pendencias juridico-operacionais agora estao consolidadas em `MARKETPLACE_POLICIES.md`

## Escopo deste documento

Inclui:

- jornada do Bar
- jornada do Musico
- estados de oportunidade, candidatura, contratacao e avaliacao
- estados vazios e erros mais importantes

Nao inclui:

- pagamentos integrados
- push notifications
- analytics
- IA de recomendacao

## Personas principais

### Bar

Responsavel por contratar artistas para datas especificas, com foco em rapidez, previsibilidade e seguranca.

### Musico

Profissional ou grupo musical que busca oportunidades, organiza agenda e fecha contratacoes com clareza.

## Navegacao de alto nivel do MVP

### Bar

- Login ou Cadastro
- Recuperar senha
- Escolha de conta
- Completar perfil do estabelecimento
- Home do Bar
- Publicar vaga
- Buscar musicos
- Propostas recebidas
- Contratacoes e agenda
- Chat
- Avaliacoes

### Musico

- Login ou Cadastro
- Recuperar senha
- Escolha de conta
- Completar perfil artistico
- Home do Musico
- Oportunidades
- Perfil artistico
- Agenda
- Convites ou candidaturas
- Chat
- Avaliacoes

## Estados de negocio

### Oportunidade

- `draft`: vaga ainda nao publicada
- `open`: vaga publicada e recebendo candidaturas
- `closed`: vaga ja fechada com artista
- `cancelled`: vaga cancelada

### Candidatura

- `submitted`: candidatura enviada
- `shortlisted`: candidatura separada pelo Bar
- `accepted`: candidatura escolhida para contratacao
- `rejected`: candidatura recusada
- `withdrawn`: candidatura retirada pelo Musico

### Contratacao

- `pending_confirmation`: Bar escolheu e aguarda aceite final
- `confirmed`: contratacao confirmada
- `completed`: evento concluido
- `cancelled`: evento cancelado

### Avaliacao

- `pending`: avaliacao disponivel, ainda nao enviada
- `submitted`: avaliacao enviada

## Fluxos do Bar

### Fluxo 0 - Recuperar acesso

1. Usuario abre `Entrar`.
2. Toca em `Recuperar acesso`.
3. Informa o email da conta.
4. Sistema envia o email de recuperacao.
5. Usuario abre o link no mesmo aparelho com o app instalado.
6. O app abre a tela de redefinicao.
7. Usuario informa a nova senha.
8. Sistema atualiza o acesso e libera o retorno ao app.

Criticos:

- feedback claro de envio do email
- feedback claro de erro quando o link e invalido
- o deep link precisa abrir no proprio app

### Fluxo 1 - Cadastro e onboarding

1. Usuario abre o app.
2. Escolhe `Criar conta`.
3. Informa email e senha.
4. Escolhe o tipo de conta `Bar`.
5. Preenche nome do estabelecimento, endereco, tipo de casa, capacidade e fotos.
6. Finaliza o perfil.
7. Entra na Home do Bar.

Criticos:

- impedir avancar sem dados minimos
- exibir progresso de perfil
- permitir completar fotos depois sem bloquear o uso

### Fluxo 2 - Publicar vaga

1. Bar acessa `Publicar vaga`.
2. Informa data, horario, duracao, estilo musical, orcamento, local e estrutura.
3. Revisa o resumo da vaga.
4. Publica.
5. Vaga entra com status `open`.
6. A vaga passa a aparecer para musicos compativeis.

Dados obrigatorios:

- data
- horario
- duracao
- estilo musical
- faixa de valor ou valor alvo
- cidade ou local do evento

### Fluxo 3 - Avaliar candidatos

1. Bar abre uma vaga publicada.
2. Visualiza lista de candidaturas.
3. Entra no perfil de um Musico.
4. Analisa fotos, links de video, repertorio, cache e reputacao.
5. Marca candidatos de interesse ou segue para conversa.

Estados uteis:

- sem candidaturas
- novas candidaturas
- candidaturas lidas

### Fluxo 4 - Conversar e contratar

1. Bar abre o chat vinculado a uma vaga ou candidato.
2. Alinha repertorio, horario de chegada, dress code e estrutura.
3. Decide contratar.
4. Seleciona o candidato.
5. Sistema cria a contratacao com status `pending_confirmation`.
6. Musico confirma.
7. Contratacao vira `confirmed`.
8. Vaga muda para `closed`.

Regra:

- apenas uma candidatura pode virar contratacao confirmada por vaga

### Fluxo 5 - Gerenciar agenda

1. Bar abre `Agenda`.
2. Visualiza eventos futuros, concluidos e cancelados.
3. Abre o detalhe de um evento.
4. Consulta status, dados do artista e historico de conversa.

### Fluxo 6 - Avaliar o Musico

1. Evento e marcado como `completed`.
2. Bar recebe prompt para avaliar.
3. Informa nota e comentarios sobre pontualidade, qualidade e profissionalismo.
4. Avaliacao vai para `submitted`.
5. Reputacao do Musico e recalculada.

## Fluxos do Musico

### Fluxo 1 - Cadastro e onboarding

1. Usuario abre o app.
2. Escolhe `Criar conta`.
3. Informa email e senha.
4. Escolhe o tipo de conta `Musico`.
5. Preenche nome artistico, categoria, estilos, regiao, cache medio e estrutura propria.
6. Adiciona fotos, links de video e repertorio.
7. Entra na Home do Musico.

Criticos:

- permitir concluir o perfil por etapas
- destacar campos que melhoram conversao de contratacao

### Fluxo 2 - Descobrir oportunidades

1. Musico abre a Home ou a lista de oportunidades.
2. Filtra por data, regiao, estilo e faixa de cache.
3. Abre a vaga.
4. Analisa detalhes do contratante e da oportunidade.

Estado vazio:

- sem vagas compativeis para os filtros atuais

### Fluxo 3 - Candidatar-se

1. Musico abre uma vaga `open`.
2. Confere se a data esta disponivel.
3. Clica em `Candidatar`.
4. Opcionalmente envia observacao curta.
5. Sistema grava candidatura com status `submitted`.
6. Musico acompanha o retorno em `Convites ou candidaturas`.

Regras:

- nao pode se candidatar duas vezes na mesma vaga
- nao pode se candidatar em vaga fechada ou cancelada

### Fluxo 4 - Receber convite direto

Este fluxo fica modelado, mas pode entrar apos o fluxo principal se o prazo do MVP apertar.

1. Bar busca o perfil do Musico.
2. Envia convite para uma vaga.
3. Musico recebe o convite.
4. Pode aceitar, recusar ou conversar antes.

### Fluxo 5 - Confirmar contratacao

1. Musico recebe aviso de selecao.
2. Entra no detalhe da contratacao.
3. Revisa data, horario, local e valor combinado.
4. Confirma.
5. Contratacao vira `confirmed`.
6. Data passa a constar como ocupada na agenda.

### Fluxo 6 - Executar evento e encerrar

1. Musico consulta o evento futuro na agenda.
2. Revisa detalhes operacionais no chat.
3. Realiza a apresentacao.
4. Evento e marcado como `completed`.
5. Avaliacao fica disponivel.

### Fluxo 7 - Avaliar o Bar

1. Apos `completed`, o Musico abre a avaliacao pendente.
2. Informa nota e comentario sobre organizacao, estrutura e pagamento combinado.
3. Avaliacao vai para `submitted`.
4. Reputacao do contratante e recalculada.

## Fluxos compartilhados

### Chat

- contexto sempre vinculado a vaga ou contratacao
- nao existe chat aberto sem relacao comercial
- o historico precisa sobreviver ao fechamento da vaga

### Agenda

- agenda do Musico combina contratacoes confirmadas com bloqueios manuais futuros
- agenda do Bar lista oportunidades abertas e contratacoes

### Perfil

- ambos precisam conseguir editar o proprio perfil
- campos incompletos devem ser sinalizados sem travar todo o uso
- preferencias de push devem poder ser ativadas e ajustadas no proprio perfil

## Estados vazios, erros e bordas

### Estados vazios essenciais

- Home do Bar sem vagas e sem contratacoes
- Home do Musico sem oportunidades compativeis
- vaga sem candidaturas
- agenda sem eventos
- perfil sem fotos ou videos

### Erros essenciais

- falha ao publicar vaga
- falha ao enviar candidatura
- falha ao carregar chat
- falha ao salvar perfil
- falha ao sincronizar token de push

### Bordas operacionais

- Musico tenta se candidatar com data ja ocupada
- Bar tenta contratar dois artistas para a mesma vaga
- usuario tenta avaliar antes do evento ser concluido
- perfil incompleto reduz confianca, mas nao deve bloquear todo o fluxo

## Mapa funcional de telas do MVP

### Lado Bar

- auth/login
- auth/cadastro
- onboarding/escolha-conta
- onboarding/perfil-bar
- home/bar
- oportunidades/nova-vaga
- oportunidades/detalhe-vaga
- musicos/busca
- musicos/perfil
- candidaturas/lista
- chat/detalhe
- agenda/lista
- agenda/detalhe
- avaliacoes/nova

### Lado Musico

- auth/login
- auth/cadastro
- onboarding/escolha-conta
- onboarding/perfil-musico
- home/musico
- oportunidades/lista
- oportunidades/detalhe
- perfil-musico/editar
- agenda/lista
- convites-candidaturas/lista
- chat/detalhe
- avaliacoes/nova

## Dependencias para refinamento futuro

- anexar ou versionar os prototipos MVC no workspace
- definir componentes e identidade visual finais
- detalhar regras de cancelamento e pagamento para fase 2
