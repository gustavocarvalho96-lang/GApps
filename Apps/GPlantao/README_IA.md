# Revisão da HMA com OpenAI

Na Anamnese, escreva após `# HMA :` e clique em **Melhorar HMA com IA**. O texto é reescrito em linguagem profissional para prontuário. Confira a sugestão, edite se necessário e clique em **Aplicar na HMA**. As outras seções são preservadas. Alterações na anamnese durante a revisão impedem aplicar uma sugestão antiga.

Somente o trecho HMA é enviado à OpenAI, mediante clique. Remova identificadores do paciente antes de enviar. A API recebe `store: false`; isso não equivale a uma garantia de retenção zero pelo provedor. O servidor não grava textos nem respostas em logs. A anamnese continua usando o salvamento local já existente no aplicativo.

## Iniciar no Windows

Forma mais simples: na pasta GApps, dê dois cliques em **Abrir GPlantao com IA.bat**, informe a chave na janela local (entrada oculta) e pressione Enter. O navegador abre automaticamente quando o servidor estiver pronto. Mantenha a janela aberta durante o uso. A chave não é salva em arquivo.

Requer Node.js 22 ou superior e uma chave OpenAI com acesso à API e saldo disponível. A chave fica apenas no ambiente do servidor. Não a coloque no HTML, JavaScript do navegador, repositório ou conversa.

Na pasta GApps, abra PowerShell e execute:

```powershell
$hmaSecret = Read-Host 'Chave da API OpenAI' -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $hmaSecret).Password
node Apps/GPlantao/server.mjs
```

Abra http://127.0.0.1:5174/GPlantao.html e mantenha o servidor aberto. Para parar, pressione Ctrl+C e execute `Remove-Item Env:OPENAI_API_KEY`. A abertura direta por arquivo continua disponível, mas a IA exige o servidor e internet. O navegador considera este endereço um armazenamento separado; rascunhos da versão por arquivo não migram automaticamente.

O modelo padrão é `gpt-5.4-mini`; para mudar, defina `$env:OPENAI_MODEL = 'identificador-do-modelo'` antes de iniciar. O servidor aceita uma revisão por vez, até 12.000 caracteres, com timeout. Ele escuta somente em 127.0.0.1 e valida a origem das chamadas. Para disponibilizar em rede será necessário configurar autenticação, HTTPS e limites por usuário.

Documentação: https://developers.openai.com/api/docs/quickstart

Testes locais sem consumo de API: `node --test tests/hma-api.test.mjs`.
