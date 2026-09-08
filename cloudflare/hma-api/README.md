# Servidor online da HMA

## Alterar a lógica da IA

Edite `HMA_INSTRUCTIONS.txt` em um editor de texto. Depois sincronize as regras com:

```powershell
node scripts/sync-instructions.mjs
```

O arquivo gerado em `src/hma-instructions.generated.mjs` é usado pelo Worker. Após a sincronização, publique uma nova versão do Worker.

Este Cloudflare Worker recebe somente o trecho da HMA, valida a origem e o código de acesso, limita chamadas por IP e envia o texto à Responses API da OpenAI com `store: false`. A chave da OpenAI nunca deve ser colocada no GitHub.

Configurações públicas em `wrangler.jsonc`: `ALLOWED_ORIGIN` é a origem autorizada do GitHub Pages e `OPENAI_MODEL` pode ser alterado depois sem mudar a interface.

Segredos obrigatórios na Cloudflare: `OPENAI_API_KEY`, criada na plataforma da OpenAI, e `APP_TOKEN`, um código longo e aleatório para autorizar seu navegador.

Depois da publicação, copie a URL `https://gplantao-hma-api.<sua-conta>.workers.dev/api/hma` para `Apps/GPlantao/hma-api-config.js`. O `APP_TOKEN` será informado uma vez no primeiro uso e ficará somente no armazenamento local daquele navegador.

Testes: execute `node --test tests/hma-api.test.mjs` na raiz do GApps.
