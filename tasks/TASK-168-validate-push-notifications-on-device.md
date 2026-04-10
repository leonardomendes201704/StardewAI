# TASK-168 - Homologar notificacoes push no device

Status: IN_PROGRESS
Inicio: 2026-04-09
Fim:
Backlog relacionado:

- BKL-032

## Objetivo

Validar no aparelho a permissao de push, a sincronizacao do token Expo, a configuracao de preferencias e o recebimento de pelo menos uma notificacao remota real do marketplace.

## Checklist de homologacao

- abrir o perfil do Bar e localizar a secao `Notificacoes push`
- abrir o perfil do Musico e localizar a secao `Notificacoes push`
- tocar em `Ativar no dispositivo`
- validar se a permissao do sistema aparece e se o status da secao e atualizado
- validar `Sincronizar token`
- disparar ao menos um evento real do marketplace:
  - candidatura
  - convite direto
  - mensagem de chat
  - confirmacao de contratacao
- conferir se a notificacao chega e se o toque abre a rota correta
- confirmar no Supabase se surgiram linhas em `push_notification_deliveries`

## Resultado esperado

A secao deve refletir permissao/token, e pelo menos um evento do marketplace deve gerar uma notificacao push remota ou, na falta de credencial nativa suficiente, expor erro objetivo sem quebrar o fluxo principal do app.
