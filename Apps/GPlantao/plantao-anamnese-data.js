const administrativeProtocols = [
  {
    id: "administrativo",
    title: "Administrativo",
    category: "Estrutura Clínica",
    prescription: "",
    orientation: "",
    tags: ["administrativo"],
    snippets: [
      ["Evasao", "PACIENTE NAO RESPONDEU AO CHAMADO 5X (CHAMADO VERBAL + SISTEMA). REALIZADO BUSCA ATIVA, NAO ENCONTRADO PACIENTE NA UNIDADE.\n."],
      ["RX - Osso", "RAIO X SEM ALTERACOES EVIDENTES DE FRATURAS, ORIENTO RETORNO SE NAO HOUVER MELHORA OU APRESENTAR PIORA,\nAFIM DE EVIDENCIAR FRATURAS NAO VISTAS INICIALMENTE"],
      ["Alta (colega)", "PACIENTE ATENDIDO E LIBERADO POR COLEGA.\nNAO TIVE CONTATO E NAO PRESTEI ASSISTENCIA AO PACIENTE.\nFECHO ATENDIMENTO PARA FINS BUROCRATICOS/ADMINISTRATIVOS."],
      ["Encaminhado (colega)", "PACIENTE ATENDIDO POR COLEGA E ENCAMINHADO PARA O PRONTO SOCORRO HSVP.\nNAO TIVE CONTATO COM O PACIENTE E NAO PRESTEI ASSISTENCIA AO PACIENTE.\nFECHO ATENDIMENTO PARA FINS BUROCRATICOS/ADMINISTRATIVOS."],
      ["Verbal (colega)", "ATENDIMENTO REALIZADO E FINALIZADO VERBALMENTE POR COLEGA.\nFECHO ATENDIMENTO NO SISTEMA PARA FINS ADMINISTRATIVOS/OPERACIONAIS.\nNAO PRESTEI ASSISTENCIA E NAO TIVE NENHUM CONTATO COM O PACIENTE EM QUESTAO"],
      ["Conduta padrao", "1 - ORIENTO USO CORRETO DAS MEDICACOES E MEDIDAS GERAIS CONFORME HIPOTESE CLINICA.\n2 - ORIENTO RETORNO IMEDIATO EM CASO DE FALTA DE AR, DOR NO PEITO, DESMAIO, CONFUSAO MENTAL, FEBRE PERSISTENTE, DOR INTENSA/PROGRESSIVA, VOMITOS PERSISTENTES, SANGRAMENTO, PIORA DO ESTADO GERAL OU QUALQUER SINAL DE ALARME.\n3 - ORIENTO ACOMPANHAMENTO AMBULATORIAL REGULAR E REAVALIACAO SE NAO HOUVER MELHORA NO PRAZO ORIENTADO."]
    ]
  },
  {
    id: "anamnese",
    title: "Anamnese",
    category: "Estrutura Clínica",
    genderedTemplate: true,
    prescription: `--> HMA :  
--> AP : 
--> MUC :
--> Alergia : 
.
--> Ao exame fisico : 
BEG, Corada,Hidratada, Acianótica, Afebril, Anicterica, Eupneica
Aparelho Pulmonar: MV Presente Bilateral Sem Ruidos Adventicios, Sem Sinais De Esforço Respiratório 
Aparelho CardioVascular: BRNF 2 Tempos Sem Sopros Audíveis 
Aparelho Abdominal: RHA Presente, Sem Defesa, Indolor À Palpação, DB Negativo, Giordano Negativo, Murphy Negativo
NEURO: Glasgow 15, Pifr, Sem Sinais Meningeos, Sem Déficit Motor
EXT: Sem Empastamento De Panturrilhas, Tec< 3 Segundos, Simétricas, Sem Edemas

--> Conduta : 
1 - Oriento uso correto das medicações e medidas gerais conforme hipótese clínica.
2 - Oriento retorno imediato em caso de falta de ar, dor no peito, desmaio, confusão mental, febre persistente, dor intensa/progressiva, vômitos persistentes, sangramento, piora do estado geral ou qualquer sinal de alarme.
3 - Oriento acompanhamento ambulatorial regular e reavaliação se não houver melhora no prazo orientado.`,
    orientation: "",
    snippets: {
      standardExam: {
        label: "Padrão",
        text: "Aparelho Pulmonar: MV Presente Bilateral Sem Ruidos Adventicios, Sem Sinais De Esforço Respiratório \nAparelho CardioVascular: BRNF 2 Tempos Sem Sopros Audíveis \nAparelho Abdominal: RHA Presente, Sem Defesa, Indolor À Palpação, DB Negativo, Giordano Negativo, Murphy Negativo\nNEURO: Glasgow 15, Pifr, Sem Sinais Meningeos, Sem Déficit Motor\nEXT: Sem Empastamento De Panturrilhas, Tec< 3 Segundos, Simétricas, Sem Edemas"
      },
      otoOro: [
        ["Otoscopia normal", "Otoscopia: condutos auditivos pérvios, sem secreção. Membranas timpânicas íntegras, sem sinais flogísticos."],
        ["Otoscopia alterada", "Otoscopia: conduto auditivo hiperemiado, com presença de secreção. Membrana timpânica hiperemiada."],
        ["Oroscopia normal", "Oroscopia: orofaringe sem hiperemia, sem placas ou exsudato. Mucosa oral úmida, sem lesões aparentes."],
        ["Oroscopia alterada", "Oroscopia: orofaringe hiperemiada, com placas/exsudato amigdaliano."]
      ],
      psych: [
        ["PsiqNor", "Exame psíquico:\nConsciência/orientação: paciente consciente, orientado em tempo e espaço, vigil.\nAtitude/apresentação: colaborativo à entrevista, higiene e vestimenta adequadas.\nFala: ritmo e volume habituais.\nHumor/afeto: humor eutímico, afeto congruente e reativo.\nPensamento: curso e forma preservados, sem conteúdo delirante evidente.\nSensopercepção: sem alterações sensoperceptivas observadas durante avaliação.\nRisco: nega ideação suicida, autoagressiva ou heteroagressiva no momento.\nPsicomotricidade: sem alterações grosseiras.\nJuízo/insight: juízo crítico e insight preservados."],
        ["PsiqAlt", "Exame psíquico:\nConsciência/orientação: paciente vigil, porém parcialmente orientado em tempo e espaço.\nAtitude/apresentação: pouco colaborativo à entrevista, higiene prejudicada e vestimenta desalinhada.\nFala: fala acelerada, com aumento do volume e difícil interrupção.\nHumor/afeto: humor irritável/ansioso, afeto lábil e pouco congruente.\nPensamento: curso do pensamento desorganizado, com fuga de ideias e conteúdo persecutório.\nSensopercepção: refere alterações sensoperceptivas, com alucinações auditivas no momento da avaliação.\nRisco: refere ideação autoagressiva/suicida, sem plano estruturado no momento; nega heteroagressividade.\nPsicomotricidade: agitação psicomotora, inquietação durante atendimento.\nJuízo/insight: juízo crítico prejudicado e insight reduzido."]
      ]
    },
    tags: ["anamnese", "exame físico"]
  },
  {
    id: "atestadite-ivas",
    title: "IVAS",
    category: "Atestadite",
    atestadite: true,
    tags: ["atestadite", "ivas", "resfriado", "rinossinusite", "gripe"],
    atestaditeSections: [
      {
        key: "anamnese",
        label: "Anamnese",
        text: `HMA : Paciente procura atendimento por quadro de sintomas gripais iniciado ha cerca de 3 dias, com coriza, obstrucao nasal, espirros, odinofagia leve e tosse seca/irritativa. Refere mal-estar geral leve e aceitacao preservada de liquidos por via oral.

Nega falta de ar, dor toracica, febre persistente, prostracao importante, confusao mental, cianose, queda do estado geral, vomitos persistentes, rigidez de nuca, disfagia importante, sialorreia, estridor, hemoptise ou piora respiratoria progressiva.

Ao exame fisico: paciente em bom estado geral, consciente e orientado, corado, hidratado, acianotico, anicterico, afebril, eupneico, hemodinamicamente estavel. Oroscopia com hiperemia leve de orofaringe, sem placas ou exsudato. Ausculta pulmonar com murmurio vesicular presente bilateralmente, sem ruidos adventicios e sem sinais de esforco respiratorio. Sem sinais de gravidade no momento.`
      },
      {
        key: "conduta",
        label: "Conduta",
        text: `Conduta : Oriento medidas gerais, hidratacao oral, repouso relativo, lavagem nasal com soro fisiologico e sintomaticos conforme necessidade.

Oriento que quadro e sugestivo de infeccao de vias aereas superiores, geralmente autolimitada, sem sinais de alarme no momento.

Oriento retorno imediato se falta de ar, dor toracica, febre persistente, prostracao importante, piora do estado geral, dificuldade para engolir, sinais de desidratacao, cianose, confusao mental ou piora respiratoria progressiva.`
      }
    ]
  },
  {
    id: "atestadite-geca",
    title: "GECA",
    category: "Atestadite",
    atestadite: true,
    tags: ["atestadite", "geca", "gastroenterite", "diarreia", "vomitos"],
    atestaditeSections: [
      {
        key: "anamnese",
        label: "Anamnese",
        text: `HMA : Paciente procura atendimento por quadro de diarreia liquida associada a nauseas e episodios de vomitos, iniciado ha cerca de 3 dias, com dor abdominal em colica, difusa e intermitente. Refere aceitacao parcial de liquidos por via oral.

Nega febre persistente, sangue ou muco nas fezes, vomitos incoerciveis, dor abdominal localizada ou progressiva, distensao abdominal importante, sincope, sonolencia, confusao mental, reducao importante da diurese, sinais de desidratacao intensa, uso recente de antibioticos, viagem recente ou contato com alimento sabidamente contaminado.

Ao exame fisico: paciente em bom estado geral, consciente e orientado, corado, hidratado, acianotico, anicterico, afebril, eupneico, hemodinamicamente estavel. Mucosas umidas, perfusao periferica preservada. Abdome flacido, ruidos hidroaereos presentes, dor leve difusa a palpacao, sem defesa, sem descompressao brusca dolorosa, sem sinais de irritacao peritoneal. Sem sinais clinicos de desidratacao importante no momento.`
      },
      {
        key: "conduta",
        label: "Conduta",
        text: `Conduta : Oriento hidratacao oral vigorosa e fracionada, dieta leve conforme tolerancia e evitar alimentos gordurosos, leite e derivados temporariamente se piorarem sintomas.

Prescrevo sintomaticos.

Oriento retorno imediato se febre persistente, sangue nas fezes, vomitos incoerciveis, dor abdominal intensa/progressiva, sinais de desidratacao, sonolencia, piora do estado geral ou ausencia de melhora.`
      }
    ]
  },
  {
    id: "reavaliacao",
    title: "Reavaliação",
    category: "Estrutura Clínica",
    labTranscription: true,
    labSources: [
      { label: "Auto", source: "auto", className: "auto-btn" },
      { label: "Campo Limpo", source: "campo-limpo", className: "campo-limpo-btn" },
      { label: "Jundiai", source: "jundiai", className: "jundiai-btn" }
    ],
    prescription: `#Reavaliação#

-->Exames labs:

-->Exames imagem:

Reavalio paciente em consultório, paciente estável hemodinamicamente (PA // FC // FR // SATO2). Paciente refere melhora dos sintomas após medicações, com condições de alta hospitalar e término de tratamento a nível domiciliar.

--> Conduta : 
1 - Oriento manter tratamento conforme prescrito e medidas gerais.
2 - Oriento retorno imediato se falta de ar, dor no peito, desmaio, confusão mental, febre persistente, dor intensa/progressiva, vômitos persistentes, sangramento, piora do estado geral ou qualquer sinal de alarme.
3 - Oriento acompanhamento ambulatorial regular e reavaliação se não houver melhora no prazo orientado.`,
    orientation: "",
    tags: ["reavaliação", "alta", "exames"]
  },
  {
    id: "internacao",
    title: "Internação",
    category: "Estrutura Clínica",
    prescription: `#Internação - Enfermaria#
--> Dia de internação : 
--> HD: 
--> ATB:
. 
--> HMA : 
--> AP:
--> MUC: 
. 
Exame fisico:
Exame laboratoriais: 
Exame imagem: 

-->Conduta:
1 - Internação na enfermaria 
2 - Suporte clinico
3 - Antibioticoterapia 
4 - Hidratação parcimoniosa`,
    orientation: "",
    tags: ["internacao", "enfermaria", "admissao"]
  }
];
