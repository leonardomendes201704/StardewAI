# TASK-030 - Implementar CEP mascarado com ViaCEP no perfil do Musico

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-013

## Objetivo

Trocar a captura manual de `cidade` e `UF` do perfil do Musico por um fluxo baseado em `CEP`, com mascara, resolucao automatica via ViaCEP e bloqueio de edicao manual da localizacao resolvida.

## Entregaveis previstos

- campo `postal_code` persistido em `artist_profiles`
- lookup automatico via ViaCEP ao completar os 8 digitos
- cidade e UF preenchidos automaticamente e nao editaveis
- validacao local e migracao aplicada no Supabase

## Entregue

- coluna `postal_code` adicionada a `public.artist_profiles` com migracao dedicada e validacao de formato
- hook de consulta ao ViaCEP implementado na camada de perfil para resolver `cidade` e `UF` a partir do CEP
- campo `CEP` do Musico convertido para digitacao mascarada em `99999-999`
- campos `Cidade` e `UF` trocados para exibicao bloqueada, preenchida automaticamente pelo CEP resolvido
- salvamento do perfil do Musico atualizado para persistir `postal_code` junto com os demais dados do perfil

## Validacao

- `npx.cmd tsc --noEmit`
- migracao `add_artist_profile_postal_code` aplicada com sucesso no Supabase
- consulta em `information_schema.columns` confirmou `artist_profiles.postal_code`
- chamada local ao endpoint `https://viacep.com.br/ws/01001000/json/` confirmou retorno com `localidade` e `uf`
