# TASK-057 - Homologar ciclo real de editar, cancelar e reabrir vaga

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-018, BKL-017

## Objetivo

Registrar a homologacao funcional do ciclo completo da vaga no app: editar, cancelar e reabrir, com reflexo correto no feed do Musico e no estado persistido do Supabase.

## Entregue

- validacao no device de que a vaga cancelada some do feed do Musico
- validacao no device de que a vaga reaberta volta a aparecer no feed do Musico
- confirmacao no Supabase de que a vaga terminou o ciclo em `status = open`
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Validacao

- relato funcional do usuario no device
- consulta SQL em `public.opportunities`
