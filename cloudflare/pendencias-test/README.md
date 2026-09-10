# GPendências — sessões online de teste

API do GPendências publicada em Cloudflare Workers com dados no D1.

- Worker: `gpendencias-teste`
- D1: `gpendencias-teste`
- Sessões de teste: senhas de `1` a `9`
- Aplicativo: `https://gpendencias-teste.gustavocarvalho96.workers.dev`
- API: `https://gpendencias-teste.gustavocarvalho96.workers.dev/api/tasks`

Cada senha seleciona uma linha independente no banco. O frontend do GitHub Pages envia e recebe a lista da sessão pela rota `/api/tasks`.

A pasta `site/` contém a cópia publicada diretamente pelo Worker para que o teste também funcione sem depender do GitHub Pages.
