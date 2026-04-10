# TASK-115 - Implementar recuperacao de acesso por email e redefinicao de senha

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-011

## Objetivo

Adicionar o fluxo minimo de recuperacao de acesso no app mobile, cobrindo solicitacao do link por email, abertura do deep link no proprio app e definicao de nova senha.

## Escopo

- CTA `Esqueci minha senha` na auth por email
- disparo de `resetPasswordForEmail` com deep link nativo
- tratamento de `PASSWORD_RECOVERY` no provider de auth
- tela de redefinicao de senha no app
- mensagens de sucesso e erro para solicitacao e troca da senha

## Resultado esperado

O usuario consegue solicitar recuperacao por email e redefinir a senha no app apos abrir o link recebido no mesmo aparelho com o TocaAI instalado.

## Resultado

O fluxo foi implementado no app com CTA `Esqueci minha senha`, envio de email por `resetPasswordForEmail`, persistencia do estado de `password-recovery` no store local, redirecionamento do deep link para uma tela dedicada de nova senha e feedbacks claros de sucesso e erro.
