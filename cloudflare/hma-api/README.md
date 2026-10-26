# Servidor online da HMA

## Alterar a lógica da IA

Edite `HMA_INSTRUCTIONS.txt` em um editor de texto. Depois sincronize as regras com:

```powershell
node scripts/sync-instructions.mjs
```

O arquivo gerado em `src/hma-instructions.generated.mjs` é usado pelo Worker. Após a sincronização, publique uma nova versão do Worker. O conteúdo clínico de `HMA_INSTRUCTIONS.txt` é mantido como foi escrito; instruções técnicas de segurança e de compatibilidade com a saída estruturada ficam separadas em `src/index.mjs`.

A IA devolve uma saída estruturada com o campo `text`. O próprio modelo integra na narrativa as negativas e os sinais de alarme pertinentes definidos em `HMA_INSTRUCTIONS.txt`; o Worker remove um eventual título `HMA:` duplicado antes de devolver o texto ao aplicativo.

Este Cloudflare Worker recebe somente o trecho da HMA, valida a origem e o código de acesso, limita chamadas por IP e envia o texto à Responses API da OpenAI com `store: false`. A chave da OpenAI nunca deve ser colocada no GitHub.

Configurações públicas em `wrangler.jsonc`: `ALLOWED_ORIGIN` é a origem autorizada do GitHub Pages e `OPENAI_MODEL` pode ser alterado depois sem mudar a interface.

Segredos obrigatórios na Cloudflare: `OPENAI_API_KEY`, criada na plataforma da OpenAI, e `APP_TOKEN`, um código longo e aleatório para autorizar seu navegador.

Depois da publicação, copie a URL `https://gplantao-hma-api.<sua-conta>.workers.dev/api/hma` para `Apps/GPlantao/hma-api-config.js`. O `APP_TOKEN` será informado uma vez no primeiro uso e ficará somente no armazenamento local daquele navegador.

Testes: execute `node --test tests/hma-api.test.mjs` na raiz do GApps.

## Anamnese dos protocolos

`POST /api/protocolos/anamnese` recebe `{ protocol: "dor-toracica", sections: [{ section, items: [{ label, value }] }] }` e retorna `{ text }`. Usa a mesma origem, código de acesso, chave, modelo e limitador da HMA, com `store: false`. Aceita até 32.000 caracteres, 32 seções e 250 respostas. Somente respostas efetivamente preenchidas são enviadas pelo formulário; campos não investigados não viram negativas.

As instruções específicas ficam em `PROTOCOL_INSTRUCTIONS.txt`. O comando `node scripts/sync-instructions.mjs` sincroniza os dois prompts. O prompt dos protocolos preserva apenas fatos fornecidos e não utiliza a regra de acrescentar negativas do revisor de HMA.

O formulário mantém rascunho local versionado, exige revisão de texto anterior antes de incluí-lo no envio e invalida a cópia quando as respostas mudam após gerar a anamnese. O total HEART só é somado quando seus cinco componentes são informados; os pontos são selecionados pelo profissional conforme a versão adotada pelo serviço.

Verificação da rota e do formulário: `node --test tests/protocol-anamnese.test.mjs tests/hma-api.test.mjs` na raiz do GApps. Esses testes simulam a OpenAI e não consomem créditos.
