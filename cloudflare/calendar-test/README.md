# Calendário de Plantões — teste no Cloudflare

Cópia de teste do calendário original, migrada do ChatGPT Sites para Cloudflare Workers com banco D1.

## Produção de teste

- Worker: `calendario-plantoes-teste`
- Banco D1: `calendario-plantoes-teste`
- Binding do banco: `DB`
- Proteção de acesso: secret `CALENDAR_TOKEN`
- Endereço: `https://calendario-plantoes-teste.gustavocarvalho96.workers.dev/`

O código-fonte original em Vinext está em `app/`, `db/` e `worker/index.ts`. O arquivo `worker/standalone.mjs` contém a versão autônoma publicada pelo acesso conectado à API do Cloudflare.

## Desenvolvimento local

Requisitos: Node.js 22.13 ou posterior e pnpm.

1. Copie `.dev.vars.example` para `.dev.vars`.
2. Defina um código local em `CALENDAR_TOKEN`.
3. Execute `pnpm install`.
4. Execute `pnpm dev`.

Para validar a compilação, execute `pnpm build`.

## Dados

As tabelas são definidas pelas migrações em `drizzle/`. A cópia inicial do banco contém as escalas-base de julho a dezembro de 2026 e os 11 meses que existiam no calendário original na data da migração.
