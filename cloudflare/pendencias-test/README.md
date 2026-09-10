# GPendências — sessões online de teste

API do GPendências publicada em Cloudflare Workers com dados no D1.

- Worker: `gpendencias-teste`
- D1: `gpendencias-teste`
- Sessões de teste: senhas de `1` a `9`
- Aplicativo: `https://gpendencias-teste.gustavocarvalho96.workers.dev`
- API: `https://gpendencias-teste.gustavocarvalho96.workers.dev/api/tasks`

Cada senha seleciona uma linha independente no banco. O frontend do GitHub Pages envia e recebe a lista da sessão pela rota `/api/tasks`.

A pasta `site/` contém a cópia publicada diretamente pelo Worker para que o teste também funcione sem depender do GitHub Pages.

## Revisão de interface e sincronização — setembro de 2026

A tela principal acompanha pacientes com checklist de pendências. Cadastro em diálogo; busca e filtros visíveis; horário e prioridade opcionais por pendência; contexto, próximo passo e responsável por paciente. A passagem de plantão seleciona pacientes em aberto e gera texto revisável, sem adicionar orientação clínica automática. Backup e operações de limpeza ficam em “Mais ações”.

Os horários são alertas visuais enquanto o aplicativo está aberto, não notificações externas. A senha simples de 1 a 9 identifica uma sessão de teste: não constitui autenticação adequada para dados reais de pacientes.

### Proteção dos dados compartilhados

- `PUT /api/tasks` exige `{tasks, revision}`. O D1 atualiza apenas quando a revisão ainda corresponde, em uma única instrução `UPDATE ... WHERE revision = ? RETURNING revision`.
- Uma revisão antiga recebe HTTP 409 e o estado atual. Alterações independentes são combinadas por item e campo; alterações concorrentes no mesmo campo exigem escolha explícita.
- Clientes antigos sem revisão recebem HTTP 428 e precisam recarregar. Não podem substituir dados novos.
- Envios são serializados. Falhas preservam a base e as alterações locais; novas tentativas acontecem a cada 12 segundos e ao reconectar.
- Cada aba tem uma fila própria no armazenamento local. Recarregar a aba retoma essa fila. Para recuperar uma aba fechada, acesse “Mais ações → Recuperar alterações locais”, com as outras abas fechadas.
- Um cache antigo não é reenviado automaticamente quando a sessão online está vazia. Backups existentes continuam disponíveis. Nenhuma migração de tabela é necessária.
- O aplicativo não recarrega a lista enquanto um formulário está aberto. Troca de sessão aguarda o envio ou a revisão de alterações pendentes.

### Código e publicação

Edite os arquivos canônicos em `GPendencias.html` e `Apps/GPendencias/`. Depois execute, na raiz:

```sh
node cloudflare/pendencias-test/build.mjs
node --test tests/pendencias-sync.test.mjs
```

O build sincroniza HTML, CSS, JS, módulo de validação/merge e logo para o Worker. Não edite manualmente as cópias em `site/` ou `cloudflare/pendencias-test/sync-core.mjs`. A publicação deve incluir todos os módulos importados pelo `worker.mjs`.

O teste `tests/pendencias-browser.mjs` usa Playwright com o site local em `http://127.0.0.1:8765/GPendencias.html`. Opcionalmente configure `PLAYWRIGHT_MODULE` (caminho do módulo) e `BROWSER_EXECUTABLE` (navegador instalado). Todas as requisições de API são interceptadas: cadastro, edição, conclusão, busca, passagem, falha de rede, recarga, revisão de conflitos e layout móvel são testados sem escrever no banco online.
