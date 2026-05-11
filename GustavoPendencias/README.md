# Pendências do Plantão

App local para registrar pacientes com exames, reavaliações e outras pendências do plantão.

No cadastro, você pode adicionar várias pendências para o mesmo paciente antes de salvar.
Cada pendência recebe automaticamente o horário de cadastro usando o relógio do computador.
Não há campo de prazo/horário limite, para se adequar melhor ao fluxo do pronto-socorro.

## Como abrir

Com Node instalado, rode:

```powershell
npm start
```

Depois abra:

```text
http://localhost:5173
```

Use `index.html` para cadastrar pendências e `cards.html` para acompanhar os cards com mais espaço:

```text
http://localhost:5173/cards.html
```

Na tela de cards, cada paciente tem o botão "Adicionar pendência" para incluir novos pedidos no mesmo card, como uma segunda amostra.

Os dados ficam salvos automaticamente no próprio navegador deste computador. Ao fechar e abrir a página de novo, as pendências continuam lá, exceto as que forem excluídas ou limpas pelo botão "Limpar feitas".
