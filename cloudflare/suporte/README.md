# Suporte do GApps

Área pessoal para anotar mudanças futuras, disponível em https://gapps-suporte.gustavocarvalho96.workers.dev/.

Os arquivos canônicos são `Suporte.html` e `Apps/Suporte/`. O Worker serve a página e protege todas as operações de dados com o secret `SUPPORT_TOKEN`. A senha fica apenas na memória da aba e é solicitada novamente a cada abertura ou recarga. Nunca grave a senha no código, em URLs ou no Git. O limitador nativo do Cloudflare limita a API a 30 requisições por minuto por IP para reduzir tentativas automatizadas de senha.

O D1 `gapps-suporte` mantém as anotações com título, descrição, aplicativo, prioridade e status. Salvar e excluir são operações explícitas; a interface só confirma o salvamento após resposta do banco. Edições e exclusões usam revisão por anotação: uma versão antiga recebe HTTP 409 e mantém o formulário para recuperar o texto. Não há salvamento offline; mantenha a aba aberta e tente novamente após uma falha de conexão.

## Publicação

Na raiz do repositório, usando o Wrangler instalado no projeto do calendário:

```powershell
node cloudflare/suporte/build.mjs
& cloudflare/calendar-test/node_modules/.bin/wrangler.cmd d1 execute gapps-suporte --remote --file cloudflare/suporte/schema.sql --config cloudflare/suporte/wrangler.jsonc
& cloudflare/calendar-test/node_modules/.bin/wrangler.cmd secret put SUPPORT_TOKEN --config cloudflare/suporte/wrangler.jsonc
& cloudflare/calendar-test/node_modules/.bin/wrangler.cmd deploy --config cloudflare/suporte/wrangler.jsonc
```

Informe o secret pelo prompt do Wrangler. O schema apenas cria a tabela ausente. O build copia a página e seus assets para `site/`, ignorada pelo Git. O frontend também funciona no GitHub Pages com a API desse Worker; CORS permite somente as origens previstas.

## Validação

`node --test tests/suporte-api.test.mjs`

Para desenvolvimento, execute o schema com `--local` e inicie `wrangler dev --port 8789` com `--var SUPPORT_TOKEN:local-test-token --var LOCAL_DEV:true`. Use apenas uma senha fictícia local. Se o runtime local instalado não suportar a data de produção, acrescente `--compatibility-date 2026-05-22` ao comando local. Os testes de navegador em `tests/suporte-browser.mjs` usam esse servidor local, banco local e dois contextos independentes. Configure `PLAYWRIGHT_MODULE` com o caminho do módulo Playwright e `BROWSER_EXECUTABLE` com o executável do navegador instalado, quando necessário.
