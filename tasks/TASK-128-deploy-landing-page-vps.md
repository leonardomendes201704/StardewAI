# TASK-128 - Publicar landing page institucional na VPS

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-041

## Objetivo

Publicar a landing page estatica do TocaAI em producao na VPS com `nginx`, dominio proprio e HTTPS valido.

## Validacao tecnica

- `Resolve-DnsName tocaai.devcraftstudio.com.br -Type A`
- `Resolve-DnsName www.tocaai.devcraftstudio.com.br -Type A`
- upload dos arquivos de `landing/` para `/var/www/tocaai.devcraftstudio.com.br/current`
- criacao de `/etc/nginx/sites-available/tocaai.devcraftstudio.com.br.conf`
- `nginx -t`
- `systemctl reload nginx`
- `certbot --nginx -d tocaai.devcraftstudio.com.br -d www.tocaai.devcraftstudio.com.br --non-interactive --agree-tos --register-unsafely-without-email --redirect`
- `curl.exe -I https://tocaai.devcraftstudio.com.br`
- `curl.exe -I https://www.tocaai.devcraftstudio.com.br`
- `certbot renew --dry-run`

## Resultado esperado

A landing institucional deve responder em `https://tocaai.devcraftstudio.com.br`, com `www.tocaai.devcraftstudio.com.br` redirecionando para o host canonico, assets estaticos servidos pelo `nginx` e certificado Let's Encrypt valido com renovacao automatica.
