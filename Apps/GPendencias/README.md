# PendÃªncias do PlantÃ£o

App local para registrar pacientes com exames, reavaliaÃ§Ãµes e outras pendÃªncias do plantÃ£o.

No cadastro, vocÃª pode adicionar vÃ¡rias pendÃªncias para o mesmo paciente antes de salvar.
Cada pendÃªncia recebe automaticamente o horÃ¡rio de cadastro usando o relÃ³gio do computador.
NÃ£o hÃ¡ campo de prazo/horÃ¡rio limite, para se adequar melhor ao fluxo do pronto-socorro.

## Como abrir

Com Node instalado, rode:

```powershell
npm start
```

Depois abra:

```text
http://localhost:5173
```

Use `GPendencias.html` para cadastrar pendÃªncias e `cards.html` para acompanhar os cards com mais espaÃ§o:

```text
http://localhost:5173/cards.html
```

Na tela de cards, cada paciente tem o botÃ£o "Adicionar pendÃªncia" para incluir novos pedidos no mesmo card, como uma segunda amostra.

Os dados ficam salvos automaticamente no prÃ³prio navegador deste computador. Ao fechar e abrir a pÃ¡gina de novo, as pendÃªncias continuam lÃ¡, exceto as que forem excluÃ­das ou limpas pelo botÃ£o "Limpar feitas".
