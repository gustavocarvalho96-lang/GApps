const antibioticOptions = [
  ["Amoxicilina", `Uso oral:
Amoxicilina 500mg ---- 21 cps
Tomar 1 cp de 8/8h por 7 dias.`],
  ["Amoxicilina + clavulanato", `Uso oral:
Amoxicilina + clavulanato 875/125mg ---- 20 cps
Tomar 1 cp de 12/12h por 10 dias.`],
  ["Azitromicina", `Uso oral:
Azitromicina 500mg ---- 5 cps
Tomar 1 cp ao dia por 5 dias.`],
  ["Cefalexina", `Uso oral:
Cefalexina 500mg ---- 28 cps
Tomar 1 cp de 6/6h por 7 dias.`],
  ["Cefuroxima", `Uso oral:
Cefuroxima 500mg ---- 14 cps
Tomar 1 cp de 12/12h por 7 dias.`],
  ["Ciprofloxacino", `Uso oral:
Ciprofloxacino 500mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`],
  ["Clindamicina", `Uso oral:
Clindamicina 300mg ---- 30 cps
Tomar 1 cp de 8/8h por 10 dias.`],
  ["Doxiciclina", `Uso oral:
Doxiciclina 100mg ---- 14 cps
Tomar 1 cp de 12/12h por 7 dias.`],
  ["Levofloxacino", `Uso oral:
Levofloxacino 750mg ---- 7 cps
Tomar 1 cp ao dia por 7 dias.`],
  ["Metronidazol", `Uso oral:
Metronidazol 400mg ---- 21 cps
Tomar 1 cp de 8/8h por 7 dias.`],
  ["Nitrofurantoína", `Uso oral:
Nitrofurantoína 100mg ---- 28 cps
Tomar 1 cp de 6/6h por 7 dias.`],
  ["Sulfametoxazol + trimetoprima", `Uso oral:
Sulfametoxazol + trimetoprima 800/160mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`]
].map(([label, value]) => ({ label, value }));

const defaultDipironaAllergyReplacements = [
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor ou febre.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor ou febre."],
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h se febre ou dor.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se febre ou dor."],
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor."],
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h."]
];

const escopolaminaDipironaAllergyReplacements = [
  ["Escopolamina + dipirona ---- 20 cps", "Escopolamina + paracetamol ---- 20 cps"]
];

const recipeProtocols = [
  {
    id: "antibioticos",
    title: "Antibióticos",
    category: "Condutas",
    prescription: "Selecione um antibiótico.",
    orientation: `- Usar o antibiótico exatamente como prescrito e completar o tempo orientado.
- Não interromper por conta própria mesmo se houver melhora.
- Efeitos comuns: náuseas, desconforto abdominal, diarreia leve, candidíase e rash.
- Retornar se não houver melhora em 72h ou se houver piora.

SINAIS DE ALARME:
- Falta de ar, chiado, urticária ou inchaço de face/lábios.
- Diarreia intensa, com sangue ou associada a febre.
- Vômitos que impeçam tomar a medicação.`,
    tags: ["antibiótico"],
    antibioticOptions
  },
  { id: "receita-livre", title: "Receita livre", category: "Estrutura Clínica", freeGroupsEnabled: true, prescription: `Uso oral:

`, orientation: "", tags: ["livre"] },
  {
    id: "colica-renal",
    title: "Cólica renal",
    category: "Urologia",
    prescription: `Uso oral:
Escopolamina + dipirona ---- 20 cps
Tomar 1 cp de 8/8h se dor.

Diclofenaco 50mg ---- 6 cps
Tomar 1 cp de 12/12h por até 3 dias.

Paracetamol + codeína 500/30mg ---- 10 cps
Tomar 1 cp de 8/8h se dor forte.

Tansulosina 0,4mg ---- 10 cps
Tomar 1 cp à noite por 10 dias.`,
    orientation: `- Manter hidratação se não houver restrição médica.
- Coar a urina se possível para identificação de cálculo.
- Evitar excesso de anti-inflamatório e retornar para reavaliação ambulatorial/urologia conforme disponibilidade.

SINAIS DE ALARME:
- Febre, calafrios ou queda do estado geral.
- Dor persistente/intensa apesar das medicações.
- Vômitos persistentes, incapacidade de ingerir líquidos ou ausência/redução importante da urina.
- Gestante, rim único ou doença renal prévia: reavaliar precocemente se piora.`,
    tags: ["cólica"]
  },
  {
    id: "constipacao",
    title: "Constipação intestinal",
    category: "Gastrointestinal",
    prescription: `Uso oral:
Simeticona 75mg/ml ---- 1 frasco
Tomar 15 gotas de 8/8h se gases.

Lactulose 667mg/ml ---- 1 frasco
Tomar 10 ml após almoço se constipação.

Óleo mineral ---- 1 frasco
Tomar 15 ml de 12/12h.`,
    addOns: [{
      stateKey: "useBisacodil",
      addLabel: "+ bisacodil",
      removeLabel: "Remover bisacodil",
      text: `

Bisacodil 5mg ---- 10 cps
Tomar 1 cp à noite se necessário.`
    }],
    orientation: `- Aumentar ingestão de água se não houver restrição médica.
- Dieta rica em fibras e caminhar conforme tolerância.
- Evitar esforço evacuatório excessivo e não usar laxativos por tempo prolongado sem reavaliação.

SINAIS DE ALARME:
- Dor abdominal intensa ou distensão progressiva.
- Vômitos persistentes, parada de eliminação de gases/fezes ou piora importante.
- Sangramento retal importante, febre ou perda de peso não explicada.`,
    tags: ["constipação"]
  },
  {
    id: "dengue",
    title: "Dengue",
    category: "Infectologia",
    prescription: `Uso oral:
Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor ou febre.

Dimenidrinato ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.

Soro de reidratação ---- 2 envelopes
Usar ao longo do dia.`,
    orientation: `- Hidratação oral rigorosa, fracionada ao longo do dia.
- NAO usar AINEs: evitar ibuprofeno, diclofenaco, cetoprofeno, naproxeno e AAS, salvo orientação médica.
- Usar preferencialmente dipirona/paracetamol conforme prescrição.
- Retornar para reavaliação conforme orientação, especialmente entre o 3º e 7º dia de sintomas.

SINAIS DE ALARME:
- Dor abdominal intensa e contínua.
- Vômitos persistentes ou incapacidade de hidratar.
- Tontura/desmaio, sonolência, irritabilidade ou piora importante.
- Sangramento de mucosas, manchas roxas, fezes escuras ou redução importante da urina.`,
    tags: ["dengue"]
  },
  {
    id: "gastroenterite",
    title: "Gastroenterite aguda",
    category: "Gastrointestinal",
    prescription: `Uso oral:
Escopolamina + dipirona ---- 20 cps
Tomar 1 cp de 8/8h se cólica.

Saccharomyces boulardii 200mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.

Dimenidrinato ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.`,
    addOns: [{
      stateKey: "useGastroCipro",
      addLabel: "+ ciprofloxacino",
      removeLabel: "Remover ciprofloxacino",
      text: `

Ciprofloxacino 500mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`
    }],
    orientation: `- Hidratação oral fracionada, em pequenos volumes e com frequência.
- Dieta leve conforme tolerância; evitar gordura, álcool e leite se piorar sintomas.
- Retornar se não houver melhora progressiva em 72h.

SINAIS DE ALARME:
- Sangue nas fezes, fezes negras ou dor abdominal intensa/progressiva.
- Vômitos persistentes ou incapacidade de ingerir líquidos.
- Febre alta/persistente, prostração, tontura ao levantar ou sinais de desidratação.`,
    tags: ["diarreia"]
  },
  {
    id: "gota-aguda",
    title: "Gota aguda",
    category: "Reumatologia",
    prescription: `Uso oral:
Colchicina 0,5mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.

Prednisona 20mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`,
    orientation: `- Repousar a articulação acometida durante a crise.
- Manter hidratação adequada se não houver restrição médica.
- Evitar álcool, excesso de carnes vermelhas, vísceras e bebidas açucaradas.
- Procurar seguimento ambulatorial para prevenção de novas crises.

SINAIS DE ALARME:
- Febre, calafrios ou articulação muito vermelha/quente com piora importante.
- Dor incapacitante sem melhora, ferida local ou imunossupressão.
- Reação adversa às medicações ou diarreia intensa com colchicina.`,
    tags: ["gota"]
  },
  {
    id: "itu",
    title: "ITU",
    category: "Infecção Urinária",
    prescription: "Selecione uma opção.",
    orientation: `- Aumentar ingesta hídrica se não houver restrição médica.
- Não reter urina.
- Usar antibiótico conforme prescrito e completar o tratamento.
- Retornar se não houver melhora em 48h ou se sintomas persistirem após tratamento.

SINAIS DE ALARME:
- Febre, calafrios, dor lombar/flancos.
- Náuseas/vômitos, fraqueza importante ou queda do estado geral.
- Sangue importante na urina, redução da urina ou piora dos sintomas urinários.
- Gestantes, idosos, homens e imunossuprimidos devem reavaliar precocemente se piora.`,
    tags: ["itu"],
    options: [
      ["Cistite - Nitrofurantoína", `Uso oral:
Nitrofurantoína 100mg ---- 28 cps
Tomar 1 cp de 6/6h por 7 dias.

Escopolamina + dipirona ---- 20 cps
Tomar 1 cp de 8/8h se dor.`],
      ["Cistite - Fosfomicina", `Uso oral:
Fosfomicina 3g ---- 1 envelope
Tomar dose única.

Escopolamina + dipirona ---- 20 cps
Tomar 1 cp de 8/8h se dor.`],
      ["Alternativa - SMX-TMP", `Uso oral:
Sulfametoxazol + trimetoprima 800/160mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`],
      ["Alternativa - Cefalexina", `Uso oral:
Cefalexina 500mg ---- 28 cps
Tomar 1 cp de 6/6h por 7 dias.`],
      ["Pielonefrite - Ciprofloxacino", `Uso oral:
Ciprofloxacino 500mg ---- 14 cps
Tomar 1 cp de 12/12h por 7 dias.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor ou febre.`],
      ["Pielonefrite - Levofloxacino", `Uso oral:
Levofloxacino 750mg ---- 5 cps
Tomar 1 cp ao dia por 5 dias.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor ou febre.`],
      ["Gestante - Cefalexina", `Uso oral:
Cefalexina 500mg ---- 28 cps
Tomar 1 cp de 6/6h por 7 dias.`],
      ["Gestante - Amoxicilina + Clavulanato", `Uso oral:
Amoxicilina + clavulanato 875/125mg ---- 14 cps
Tomar 1 cp de 12/12h por 7 dias.`]
    ].map(([label, value]) => ({ label, value }))
  },
  {
    id: "ivas",
    title: "IVAS / Resfriado comum",
    category: "Respiratório",
    prescription: `Uso oral:
Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor ou febre.

Loratadina 10mg ---- 5 cps
Tomar 1 cp ao dia por 5 dias.

Prednisona 20mg ---- 5 cps
Tomar 1 cp cedo por 5 dias.

Acetilcisteína 40mg/ml ---- 1 frasco
Tomar 15 ml à noite por 5 dias.`,
    orientation: `- Hidratação oral, repouso relativo e lavagem nasal com soro fisiológico se congestão.
- Evitar fumaça, poeira e frio intenso.
- Sintomas virais costumam melhorar progressivamente em poucos dias.

SINAIS DE ALARME:
- Falta de ar, chiado intenso, dor torácica ou cansaço aos mínimos esforços.
- Febre persistente por mais de 72h, febre que retorna após melhora ou piora importante.
- Saturação baixa se medida, confusão, sonolência excessiva ou queda do estado geral.`,
    tags: ["tosse", "coriza", "odinofagia", "resfriado"]
  },
  {
    id: "infeccao-pele",
    title: "Infecção de pele",
    category: "Dermatologia",
    prescription: "Selecione uma opção.",
    orientation: `- Manter área limpa e seca.
- Elevar o membro acometido se aplicável.
- Não espremer lesões.
- Marcar a borda da vermelhidão pode ajudar a perceber progressão.

SINAIS DE ALARME:
- Febre, calafrios ou queda do estado geral.
- Aumento rápido da vermelhidão, dor intensa, bolhas, áreas arroxeadas/escurecidas ou secreção importante.
- Listras vermelhas pelo membro, dormência ou ausência de melhora em 48h.`,
    tags: ["celulite", "erisipela", "pele", "infecção"],
    options: [
      ["Cefalexina", `Uso oral:
Cefalexina 500mg ---- 28 cps
Tomar 1 comprimido de 6/6h por 7 dias.

Diclofenaco 50mg ---- 12 cps
Tomar 1 comprimido de 8/8h por 4 dias.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se febre ou dor.`],
      ["Clindamicina + Ciprofloxacino", `Uso oral:
Clindamicina 300mg ---- 60 cps
Tomar 2 comprimidos de 8/8h por 10 dias.

Ciprofloxacino 500mg ---- 14 cps
Tomar 1 comprimido de 12/12h por 7 dias.

Prednisona 20mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`]
    ].map(([label, value]) => ({ label, value }))
  },
  {
    id: "conjuntivite",
    title: "Conjuntivite",
    category: "Oftalmologia",
    prescription: "Selecione uma opção.",
    orientation: `- Lavar as mãos com frequência e evitar coçar os olhos.
- Não compartilhar toalhas, maquiagem ou colírios.
- Suspender lentes de contato até melhora completa e liberação.
- Higiene ocular com soro fisiológico, sem manipular excessivamente.

SINAIS DE ALARME:
- Dor ocular intensa, piora da visão ou fotofobia importante.
- Trauma ocular, uso de lente de contato com dor, secreção intensa ou piora progressiva.
- Ausência de melhora em 72h ou acometimento importante em criança pequena/imunossuprimido.`,
    tags: ["olho vermelho", "secreção", "conjuntivite", "lente de contato"],
    options: [
      ["Simples", `Uso tópico:
Carmelose sódica (lágrima artificial) ---- 1 frasco
Aplicar 2 gotas em ambos os olhos de 6/6h.

Tobramicina colírio 0,3% ---- 1 frasco
Aplicar 1 gota no olho acometido de 6/6h por 7 dias.

Higiene ocular com soro fisiológico 0,9%`],
      ["Lente de contato / risco maior", `Uso tópico:
Carmelose sódica (lágrima artificial) ---- 1 frasco
Aplicar 2 gotas em ambos os olhos de 6/6h.

Ciprofloxacino colírio 0,3% ---- 1 frasco
Aplicar 1 gota no olho acometido de 6/6h por 5 a 7 dias.

Suspender uso de lentes de contato até resolução completa dos sintomas.`]
    ].map(([label, value]) => ({ label, value }))
  },
  {
    id: "herpes-zoster",
    title: "Herpes zoster",
    category: "Infectologia",
    prescription: "Selecione uma opção.",
    orientation: `- Iniciar antiviral o quanto antes, preferencialmente até 72h do início das lesões.
- Manter lesões limpas, secas e cobertas quando possível.
- Evitar manipular vesículas e lavar as mãos após contato.
- Evitar contato direto das lesões com gestantes, recém-nascidos, imunossuprimidos e pessoas não imunizadas.

SINAIS DE ALARME:
- Lesões ou dor em região ocular/fronte/nariz.
- Dor intensa refratária ou piora progressiva.
- Lesões disseminadas, febre persistente ou queda do estado geral.
- Fraqueza, alteração de sensibilidade, confusão ou qualquer déficit neurológico.
- Paciente imunossuprimido deve reavaliar precocemente.`,
    tags: ["zoster", "herpes", "vesículas", "dor neuropática"],
    options: [
      ["Valaciclovir (1ª linha)", `Uso oral:
Valaciclovir 1g ---- 21 cps
Tomar 1 cp de 8/8h por 7 dias.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor.

Paracetamol + codeína 500/30mg ---- 10 cps
Tomar 1 cp de 8/8h se dor moderada a forte.

Gabapentina 300mg ---- 30 cps
Tomar 1 cp à noite, podendo aumentar conforme dor.

Uso tópico:
Aciclovir creme ---- 1 tubo
Aplicar nas lesões de 5x/dia.`],
      ["Aciclovir (SUS)", `Uso oral:
Aciclovir 200mg ---- 140 cps
Tomar 4 cps de 4/4h (5x/dia, pulando madrugada) por 7 dias.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor.

Paracetamol + codeína 500/30mg ---- 10 cps
Tomar 1 cp de 8/8h se dor moderada a forte.

Gabapentina 300mg ---- 30 cps
Tomar 1 cp à noite, podendo aumentar conforme dor.

Uso tópico:
Aciclovir creme ---- 1 tubo
Aplicar nas lesões de 5x/dia.`]
    ].map(([label, value]) => ({ label, value }))
  },
  {
    id: "labirintite",
    title: "Labirintite / Vertigem",
    category: "Neurologia",
    prescription: `Uso oral:
Betaistina 16mg ---- 20 cps
Tomar 1 cp de 12/12h se tontura rotatória.

Dimenidrinato + piridoxina ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.`,
    orientation: `- Evitar movimentos bruscos da cabeça durante a crise.
- Levantar-se lentamente e evitar dirigir/operar máquinas enquanto houver tontura ou sonolência.
- Manter hidratação e repouso relativo.

SINAIS DE ALARME:
- Fraqueza, dormência, alteração da fala, visão dupla ou dificuldade para andar.
- Cefaleia súbita/intensa, desmaio, dor torácica ou falta de ar.
- Vômitos persistentes, piora importante ou sintomas contínuos sem melhora.`,
    tags: ["tontura", "vertigem", "náusea"]
  },
  {
    id: "hemorroida-fissura",
    title: "Hemorroida / Fissura anal",
    category: "Gastrointestinal",
    prescription: `Uso oral:
Diclofenaco 50mg ---- 15 cps
Tomar 1 comprimido de 8/8h por até 5 dias se dor.

Diosmina + hesperidina 450/50mg ---- 30 cps
Tomar 1 cp de 6/6h por 4 dias, seguido de 8/8h por 3 dias; após, 1 cp/dia.

Óleo mineral ---- 1 frasco
Tomar 15 ml (uma colher de sopa) de 12/12h.

Uso local:
Lidocaína + corticoide (pomada retal) ---- 1 tubo
Aplicar em região anal afetada 3x/dia até melhora; após, manter 1x/dia.`,
    orientation: `- Banho de assento com água morna por 10-15 minutos, 2-3x/dia.
- Dieta rica em fibras e aumento da ingesta hídrica se não houver restrição.
- Evitar esforço evacuatório e longos períodos no vaso sanitário.

SINAIS DE ALARME:
- Dor anal intensa/progressiva ou massa dolorosa persistente.
- Sangramento volumoso, fezes negras, tontura/desmaio.
- Febre, secreção purulenta, imunossupressão ou ausência de melhora.`,
    tags: ["hemorroida", "fissura", "dor anal", "sangramento"]
  },
  {
    id: "ceratite-fotoeletrica",
    title: "Ceratite fotoelétrica (solda)",
    category: "Oftalmologia",
    prescription: `Uso tópico:
Epitelizante oftálmico (retinol + aminoácidos) ---- 1 bisnaga
Aplicar 1 cm da pomada dentro da pálpebra inferior, 2x ao dia.

Carmelose sódica ---- 1 frasco
Aplicar 2 gotas no olho afetado 6x ao dia.

Cetorolaco trometamol 5mg/ml (colírio) ---- 1 frasco
Aplicar 1 gota no olho afetado de 8/8h por 7 dias.`,
    orientation: `- Evitar exposição à luz intensa e usar óculos escuros.
- Não coçar os olhos e não usar lente de contato até melhora completa.
- Usar colírios/pomadas conforme prescrito.

SINAIS DE ALARME:
- Redução da visão, dor intensa/progressiva ou fotofobia importante.
- Secreção purulenta, trauma ocular associado ou ausência de melhora em 24-48h.
- Qualquer suspeita de corpo estranho ou queimadura química exige reavaliação imediata.`,
    tags: ["ceratite", "solda", "dor ocular", "fotofobia"]
  },
  {
    id: "gastrite",
    title: "Gastrite / Refluxo / Dispepsia",
    category: "Gastrointestinal",
    prescription: `Uso oral:
Omeprazol 20mg ---- 30 cps
Tomar 1 cp em jejum.

Hidróxido de alumínio ---- 1 frasco
Tomar 5 ml após refeições.

Dimenidrinato ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.

Domperidona 10mg ---- 30 cps
Tomar 1 cp antes das refeições.`,
    orientation: `- Evitar deitar por 2-3h após refeições e elevar cabeceira se refluxo noturno.
- Evitar álcool, cigarro, café, refrigerantes, frituras e alimentos que piorem sintomas.
- Preferir refeições menores e mais leves.

SINAIS DE ALARME:
- Dor torácica em aperto, falta de ar, suor frio ou dor irradiada.
- Vômitos persistentes, vômito com sangue, fezes negras ou perda de peso.
- Dor abdominal intensa/progressiva, dificuldade para engolir ou anemia conhecida.`,
    tags: ["epigastralgia", "refluxo", "azia"]
  },
  {
    id: "escabiose",
    title: "Escabiose / Sarna humana",
    category: "Dermatologia",
    prescription: `Uso oral:
Ivermectina 6mg ---- 2 cps
Tomar 2 cps dose única e repetir em 15 dias.

Hidroxizine 25mg ---- 15 cps
Tomar 1 cp de 8/8h por 5 dias.

Uso tópico:
Permetrina 5% ---- 1 frasco
Aplicar à noite por 3 dias consecutivos.`,
    orientation: `- Trocar roupas de cama, banho e corpo no dia do tratamento.
- Lavar roupas/lençóis em água quente quando possível ou deixar isolados em saco fechado por alguns dias.
- Manter unhas curtas e evitar coçar para reduzir infecção secundária.
- Avaliar e tratar contactantes próximos conforme orientação.

SINAIS DE ALARME:
- Febre, pus, dor importante ou vermelhidão progressiva nas lesões.
- Lesões extensas/crostosas, imunossupressão ou ausência de melhora após tratamento adequado.`,
    tags: ["prurido", "escabiose", "sarna"]
  },
  {
    id: "enxaqueca",
    title: "Enxaqueca",
    category: "Neurologia",
    prescription: `Uso oral:
Metoclopramida 10mg ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.

Naproxeno 550mg ---- 5 cps
Tomar 1 cp ao dia por até 5 dias.

Mesilato de diidroergotamina 1mg + dipirona 350mg + cafeína 100mg ---- 12 cps
Tomar 1 cp no início da crise, podendo repetir de 8/8h se necessário.

Sumatriptana 25mg ---- 4 cps
Tomar 1 cp de 8/8h se dor forte.`,
    orientation: `- Repousar em ambiente escuro/silencioso durante a crise.
- Manter hidratação, sono regular e alimentação sem jejum prolongado.
- Evitar gatilhos habituais e uso excessivo de analgésicos.

SINAIS DE ALARME:
- Cefaleia súbita e muito intensa, especialmente se for a pior da vida.
- Fraqueza, dormência, alteração da fala, confusão, convulsão ou alteração visual persistente.
- Febre, rigidez de nuca, dor após trauma, vômitos persistentes ou piora progressiva.`,
    allergyReplacements: [
      ["Mesilato de diidroergotamina 1mg + dipirona 350mg + cafeína 100mg ---- 12 cps\nTomar 1 cp no início da crise, podendo repetir de 8/8h se necessário.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor."]
    ],
    tags: ["cefaleia", "fotofobia", "náusea"]
  },
  {
    id: "lombalgia",
    title: "Dor Aguda",
    category: "Ortopedia",
    prescription: "Selecione uma opção.",
    orientation: `- Manter repouso relativo, evitando carregar peso e movimentos que piorem a dor.
- Caminhadas leves e alongamentos suaves conforme tolerância; evitar repouso absoluto prolongado.
- Usar medicações conforme prescrito e evitar dirigir se houver sonolência.

SINAIS DE ALARME:
- Fraqueza nas pernas, dormência progressiva ou perda de sensibilidade em sela.
- Perda de controle urinário/fecal ou retenção urinária.
- Febre, perda de peso, dor após trauma importante, dor noturna progressiva ou ausência de melhora.`
    ,orientationOptions: [
      ["Dor lombar", `- Manter repouso relativo, evitando carregar peso e movimentos que piorem a dor.
- Caminhadas leves e alongamentos suaves conforme tolerância; evitar repouso absoluto prolongado.
- Usar medicações conforme prescrito e evitar dirigir se houver sonolência.

SINAIS DE ALARME:
- Fraqueza nas pernas, dormência progressiva ou perda de sensibilidade em sela.
- Perda de controle urinário/fecal ou retenção urinária.
- Febre, perda de peso, dor após trauma importante, dor noturna progressiva ou ausência de melhora.`],
      ["Dor aguda geral", `- Manter repouso relativo e evitar esforços ou movimentos que piorem a dor.
- Usar as medicações conforme prescrito, evitando associar remédios por conta própria.
- Aplicar gelo ou calor local conforme melhor alívio e manter hidratação adequada.

SINAIS DE ALARME:
- Dor intensa ou progressiva, dor que impede atividades básicas ou desperta do sono.
- Febre, vermelhidão/inchaço importante, deformidade, perda de força ou perda de sensibilidade.
- Dor no peito, falta de ar, desmaio, vômitos persistentes, piora do estado geral ou ausência de melhora.`]
    ].map(([label, value]) => ({ label, value })),
    tags: ["lombalgia"],
    options: [
      ["AINE + Dipirona + Ciclobenzaprina", `Uso oral:
Diclofenaco 50mg ---- 15 cps
Tomar 1 cp de 8/8h por 5 dias.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor.

Ciclobenzaprina 5mg ---- 10 cps
Tomar 1 cp à noite.`],
      ["Paracetamol + Codeína", `Uso oral:
Paracetamol + codeína 500/30mg ---- 10 cps
Tomar 1 cp de 8/8h se dor.

Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor.

Ciclobenzaprina 5mg ---- 10 cps
Tomar 1 cp à noite.`],
      ["Tramal + Antiemético", `Uso oral:
Tramadol 50mg ---- 10 cps
Tomar 1 cp de 8/8h se dor intensa.

Ondansetrona 4mg ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.`]
    ].map(([label, value]) => ({ label, value }))
  }
];
