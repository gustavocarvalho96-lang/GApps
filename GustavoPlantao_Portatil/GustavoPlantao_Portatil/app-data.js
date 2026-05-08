const freeGroups = {
  dor: [
    ["Cetoprofeno", `Cetoprofeno 100mg ---- 6 cps
Tomar 1 cp de 12/12h por até 3 dias.`],
    ["Diclofenaco", `Diclofenaco 50mg ---- 9 cps
Tomar 1 cp de 8/8h por até 3 dias.`],
    ["Dipirona", `Dipirona 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor ou febre.`],
    ["Ibuprofeno", `Ibuprofeno 400mg ---- 9 cps
Tomar 1 cp de 8/8h por até 3 dias.`],
    ["Paracetamol", `Paracetamol 500mg ---- 20 cps
Tomar 1 cp de 6/6h se dor ou febre.`],
    ["Paracetamol + codeina", `Paracetamol + codeína 500/30mg ---- 10 cps
Tomar 1 cp de 8/8h se dor moderada a forte.`],
    ["Tramadol", `Tramadol 50mg ---- 10 cps
Tomar 1 cp de 6/6h se dor forte.`]
  ],
  gastro: [
    ["Dimenidrinato", `Dimenidrinato ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.`],
    ["Escopolamina + dipirona", `Escopolamina + dipirona ---- 20 cps
Tomar 1 cp de 8/8h se cólica.`],
    ["Metoclopramida", `Metoclopramida 10mg ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.`],
    ["Omeprazol", `Omeprazol 20mg ---- 14 cps
Tomar 1 cp em jejum.`],
    ["Ondansetrona", `Ondansetrona 4mg ---- 10 cps
Tomar 1 cp de 8/8h se náuseas/vômitos.`],
    ["Simeticona", `Simeticona 75mg/ml ---- 1 frasco
Tomar 15 gotas de 8/8h.`]
  ],
  resp: [
    ["Acetilcisteina", `Acetilcisteína xarope 40mg/ml ---- 1 frasco
Tomar 15 ml à noite por 5 dias.`],
    ["Ambroxol", `Ambroxol xarope ---- 1 frasco
Tomar 5 ml de 8/8h por 5 dias.`],
    ["Dexclorfeniramina", `Dexclorfeniramina 2mg ---- 20 cps
Tomar 1 cp de 8/8h.`],
    ["Koide D", `Koide D xarope ---- 1 frasco
Tomar 5 ml de 8/8h por 5 dias.`],
    ["Loratadina", `Loratadina 10mg ---- 5 cps
Tomar 1 cp ao dia por 5 dias.`],
    ["Prednisona", `Prednisona 20mg ---- 10 cps
Tomar 1 cp de 12/12h por 5 dias.`]
  ],
  orientacoes: [
    ["AINEs", `ORIENTAÇÕES SOBRE AINEs:
- Usar pelo menor tempo possível e evitar associar dois anti-inflamatórios.
- Tomar após alimentação e evitar álcool durante o uso.
- Evitar uso se doença renal, gastrite/úlcera importante, sangramento digestivo prévio, alergia a AINE, uso de anticoagulante ou gestação, salvo orientação médica.
- Manter boa hidratação.

SINAIS DE ALARME:
- Dor forte no estômago, vômitos persistentes ou fezes escuras.
- Redução importante da urina, inchaço ou falta de ar.
- Reação alérgica, placas no corpo, inchaço de face/lábios ou chiado.`],
    ["Antibiotico", `ORIENTAÇÕES SOBRE ANTIBIÓTICO:
- Usar exatamente como prescrito e completar o tempo orientado, mesmo com melhora.
- Não compartilhar antibiótico e não guardar sobras para uso futuro.
- Efeitos comuns: náuseas, desconforto abdominal, diarreia leve, candidíase e rash.
- Retornar se não houver melhora em 72h ou se houver piora clínica.

SINAIS DE ALARME:
- Falta de ar, chiado, inchaço de face/lábios ou urticária.
- Diarreia intensa, com sangue ou associada a febre.
- Vômitos que impedem tomar a medicação.`],
    ["Cardiaco", `ORIENTAÇÕES CARDÍACAS:
- Manter uso correto das medicações habituais.
- Evitar esforço físico intenso até reavaliação.
- Controlar pressão/glicemia se aplicável e manter acompanhamento ambulatorial.

SINAIS DE ALARME:
- Dor ou pressão no peito, principalmente se durar mais que alguns minutos.
- Dor irradiando para braço, costas, pescoço ou mandíbula.
- Falta de ar, suor frio, náuseas, palpitações persistentes, desmaio ou sensação de desmaio.
- Fraqueza em um lado do corpo, alteração da fala ou confusão mental.`],
    ["Cefaleia", `ORIENTAÇÕES CEFALEIA:
- Manter hidratação, alimentação regular e repouso em ambiente calmo.
- Evitar álcool, privação de sono e gatilhos conhecidos.
- Usar medicações conforme prescrito, evitando uso excessivo de analgésicos.

SINAIS DE ALARME:
- Dor súbita e muito intensa, especialmente se for a pior da vida.
- Febre, rigidez de nuca, confusão, sonolência ou desmaio.
- Fraqueza, formigamento, alteração da fala, convulsão ou alteração visual.
- Dor após trauma na cabeça, dor progressiva ou vômitos persistentes.`],
    ["Dor", `ORIENTAÇÕES DOR:
- Repouso relativo e evitar esforços que piorem o quadro.
- Usar analgésicos conforme prescrito e não ultrapassar a dose orientada.
- Reavaliar se não houver melhora no prazo combinado ou se a dor mudar de padrão.

SINAIS DE ALARME:
- Dor intensa ou progressiva, dor que impede atividades básicas ou desperta do sono.
- Febre, vômitos persistentes, desmaio, falta de ar ou dor no peito.
- Perda de força, perda de sensibilidade, inchaço importante ou piora do estado geral.`],
    ["Gastroenterite", `ORIENTAÇÕES GASTROENTERITE:
- Manter hidratação oral fracionada, em pequenos volumes e com frequência.
- Preferir dieta leve; evitar álcool, gordura e leite se piorar sintomas.
- Retornar se não houver melhora progressiva em 72h.

SINAIS DE ALARME:
- Sangue nas fezes, fezes negras ou dor abdominal intensa/progressiva.
- Vômitos persistentes ou incapacidade de ingerir líquidos.
- Febre alta/persistente, prostração, tontura ao levantar ou sinais de desidratação.
- Idosos, gestantes, imunossuprimidos e crianças pequenas devem reavaliar mais cedo se piora.`],
    ["Gerais", `ORIENTAÇÕES GERAIS:
- Manter hidratação, repouso relativo e alimentação leve conforme tolerância.
- Usar as medicações conforme prescrito e evitar automedicação adicional.
- Procurar seguimento ambulatorial para reavaliação e continuidade do cuidado.

SINAIS DE ALARME:
- Falta de ar, dor no peito, desmaio, confusão mental ou sonolência excessiva.
- Febre persistente, dor intensa/progressiva, vômitos persistentes ou piora importante do estado geral.
- Sangramentos, redução importante da urina, fraqueza importante ou qualquer sintoma novo preocupante.`],
    ["ITU", `ORIENTAÇÕES ITU:
- Aumentar ingesta hídrica se não houver restrição médica.
- Não reter urina e urinar sempre que houver vontade.
- Usar antibiótico conforme prescrito e completar o tratamento.
- Retornar se não houver melhora em 48h ou se sintomas persistirem após o tratamento.

SINAIS DE ALARME:
- Febre, calafrios, dor lombar ou dor nos flancos.
- Náuseas/vômitos, fraqueza importante ou queda do estado geral.
- Sangue importante na urina, redução da urina ou piora dos sintomas urinários.
- Gestantes, idosos, homens e pacientes imunossuprimidos devem reavaliar precocemente se piora.`],
    ["Musculoesqueletico", `ORIENTAÇÕES MUSCULOESQUELÉTICAS:
- Repouso relativo, evitar sobrecarga e retornar gradualmente às atividades.
- Se trauma recente, aplicar gelo nas primeiras 48h; depois calor local pode ajudar em contraturas.
- Manter mobilização leve conforme tolerância, evitando imobilização prolongada sem orientação.

SINAIS DE ALARME:
- Dor intensa/progressiva, deformidade, incapacidade de apoiar ou movimentar.
- Perda de força, dormência, formigamento progressivo ou alteração de sensibilidade.
- Inchaço importante, vermelhidão com febre, extremidade fria/pálida ou ausência de melhora.`],
    ["Respiratorio", `ORIENTAÇÕES RESPIRATÓRIO:
- Manter hidratação, repouso relativo e evitar fumaça, poeira e frio intenso.
- Usar medicações conforme prescrito.
- Retornar se febre ou sintomas não melhorarem em 72h, ou se houver piora.

SINAIS DE ALARME:
- Falta de ar, chiado intenso, lábios arroxeados ou cansaço aos mínimos esforços.
- Dor torácica, confusão, sonolência excessiva ou saturação baixa se medida.
- Febre persistente por mais de 72h, febre que retorna após melhora ou piora importante da tosse.`],
    ["Sinais de alarme", `SINAIS DE ALARME:
Retornar imediatamente ou procurar emergência se houver falta de ar, dor no peito, desmaio, confusão mental, sonolência excessiva, febre persistente, dor intensa/progressiva, vômitos persistentes, sangramento, redução importante da urina, fraqueza importante, piora do estado geral ou qualquer sintoma novo preocupante.`],
    ["Vomitos", `ORIENTAÇÕES VÔMITOS:
- Hidratação oral fracionada: pequenos goles, várias vezes ao dia.
- Dieta leve conforme tolerância; evitar gordura, álcool e grandes volumes de uma vez.
- Usar antiemético se prescrito.

SINAIS DE ALARME:
- Vômitos persistentes ou incapacidade de manter líquidos.
- Sinais de desidratação: boca seca, tontura, sonolência, pouca urina.
- Sangue no vômito, fezes negras, dor abdominal intensa, febre alta ou piora importante.
- Crianças pequenas, idosos, gestantes e imunossuprimidos devem reavaliar mais cedo se piora.`],
    ["TCE", `ORIENTAÇÕES TCE (Traumatismo Cranioencefálico leve):
- Manter repouso relativo por 24-48h e evitar álcool, sedativos e dirigir se houver tontura/sonolência.
- Permanecer com acompanhante nas primeiras 24h, se possível.
- Evitar esporte, esforço físico intenso e risco de novo trauma até melhora completa.
- Pode haver cefaleia leve, tontura ou náusea inicial; deve haver melhora progressiva.

SINAIS DE ALARME:
- Dor de cabeça forte, progressiva ou que não melhora.
- Vômitos repetidos, convulsão, desmaio ou perda de consciência.
- Sonolência excessiva, dificuldade para acordar, confusão, agitação ou comportamento estranho.
- Fraqueza, dormência, fala enrolada, desequilíbrio, visão dupla ou pupilas diferentes.
- Saída de sangue/líquido pelo ouvido ou nariz.`]
  ]
};

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

const referralTemplates = [
  ["Cardiologia", "Cardiologia", "HAS/DM descompensado / dor torácica / palpitações / alteração eletrocardiográfica", "Paciente avaliado em unidade de pronto atendimento, com necessidade de seguimento cardiológico para investigação, ajuste terapêutico e acompanhamento especializado.", "ECG, exames laboratoriais e/ou demais exames disponíveis em anexo, se houver.", "Orientado manter medicações habituais e retorno imediato se dor/pressão torácica, dispneia, síncope, palpitações persistentes, sudorese fria, déficit neurológico ou piora clínica."],
  ["Dermatologia", "Dermatologia", "Lesão cutânea persistente / dermatite / infecção de pele recorrente / lesão a esclarecer", "Paciente avaliado por queixa dermatológica, necessitando avaliação especializada para diagnóstico, tratamento e seguimento.", "Exames disponíveis em anexo, se houver.", "Orientado cuidados locais e retorno se febre, dor intensa, secreção, disseminação rápida da lesão, áreas arroxeadas/escurecidas ou piora clínica."],
  ["Gastroenterologia", "Gastroenterologia", "Dispepsia / DRGE / dor abdominal recorrente / alteração intestinal persistente", "Paciente avaliado por queixa gastrointestinal recorrente/persistente, necessitando investigação e seguimento especializado.", "Exames laboratoriais, imagem/endoscopia se disponíveis em anexo.", "Orientado retorno imediato se dor abdominal intensa/progressiva, vômitos persistentes, sangramento, fezes negras, perda ponderal importante, desmaio ou piora clínica."],
  ["Ginecologia", "Ginecologia", "Dor pélvica / sangramento uterino anormal / corrimento / alteração ginecológica a esclarecer", "Paciente avaliada por queixa ginecológica, necessitando avaliação especializada para investigação, tratamento e seguimento.", "Exames laboratoriais, urina, ultrassom e/ou demais exames disponíveis em anexo, se houver.", "Orientada retorno imediato se dor pélvica intensa, sangramento volumoso, febre, síncope, gestação suspeita/confirmada com dor ou sangramento, ou piora clínica."],
  ["Neurologia", "Neurologia", "Cefaleia recorrente / tontura / parestesias / alteração neurológica a esclarecer", "Paciente avaliado por sintomas neurológicos, sem critérios de emergência no momento, necessitando investigação e seguimento especializado.", "Exames laboratoriais, neuroimagem e/ou demais exames disponíveis em anexo, se houver.", "Orientado retorno imediato se déficit neurológico, confusão, convulsão, síncope, pior cefaleia da vida, alteração da fala/visão, febre com rigidez de nuca ou piora clínica."],
  ["Oftalmologia", "Oftalmologia", "Dor ocular / olho vermelho / baixa acuidade visual / trauma ocular / lesão corneana", "Paciente avaliado por queixa ocular, necessitando avaliação especializada para exame oftalmológico completo e seguimento.", "Exame clínico realizado na unidade e/ou exames disponíveis em anexo, se houver.", "Orientado evitar manipulação ocular/lente de contato e retorno imediato se dor intensa, piora visual, fotofobia importante, secreção intensa, trauma ou piora clínica."],
  ["Ortopedia", "Ortopedia", "Dor osteomuscular / trauma / limitação funcional / suspeita de lesão ortopédica", "Paciente avaliado por queixa osteomuscular, sem resolução completa em atendimento inicial, necessitando avaliação ortopédica para seguimento e definição terapêutica.", "Radiografia e/ou exames disponíveis em anexo, se houver.", "Orientado repouso relativo e retorno se dor progressiva, incapacidade funcional, déficit motor/sensitivo, edema importante, deformidade, febre ou extremidade fria/pálida."],
  ["Psiquiatria", "Psiquiatria / Saúde Mental", "Ansiedade / depressão / ideação suicida / alteração comportamental / sofrimento psíquico", "Paciente avaliado por sofrimento psíquico, necessitando acompanhamento especializado em saúde mental para estratificação de risco e seguimento terapêutico.", "Sem exames específicos no momento, salvo se anexados.", "Orientado acionar rede de apoio e retorno imediato se ideação suicida, plano de autoagressão, risco de heteroagressão, agitação importante, alucinações, confusão ou piora clínica."],
  ["UBS / PSF", "UBS / Estratégia Saúde da Família", "Seguimento ambulatorial regular / reavaliação de comorbidades / continuidade de cuidado", "Encaminho para seguimento longitudinal, reavaliação clínica e continuidade do cuidado na atenção básica.", "Exames disponíveis em anexo, se houver.", "Orientado manter tratamento prescrito, levar exames/receitas à UBS e retornar à urgência se falta de ar, dor no peito, desmaio, confusão, febre persistente, dor intensa/progressiva ou piora clínica."],
  ["Urologia", "Urologia", "Litíase urinária / ITU recorrente / hematúria / sintomas urinários persistentes", "Paciente avaliado por queixa urinária/urológica, necessitando seguimento especializado para investigação e manejo definitivo.", "Urina tipo I, urocultura, função renal, ultrassom/tomografia e/ou exames disponíveis em anexo, se houver.", "Orientado hidratação se não houver restrição e retorno imediato se febre, calafrios, dor lombar/flancos, dor intensa, vômitos persistentes, anúria/redução importante da urina ou piora clínica."]
].map(([label, specialty, hypothesis, summary, exams, conduct]) => ({ label, specialty, hypothesis, summary, exams, conduct }));

const defaultDipironaAllergyReplacements = [
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor ou febre.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor ou febre."],
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h se febre ou dor.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se febre ou dor."],
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h se dor."],
  ["Dipirona 500mg ---- 20 cps\nTomar 1 cp de 6/6h.", "Paracetamol 500mg ---- 20 cps\nTomar 1 cp de 6/6h."]
];

const escopolaminaDipironaAllergyReplacements = [
  ["Escopolamina + dipirona ---- 20 cps", "Escopolamina + paracetamol ---- 20 cps"]
];

const protocolsBase = [
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
    id: "reavaliacao",
    title: "Reavaliação",
    category: "Estrutura Clínica",
    labTranscription: true,
    labSources: [
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
  },
  { id: "encaminhamento", title: "Encaminhamento", category: "Estrutura Clínica", prescription: "", orientation: "", tags: ["encaminhamento", "especialista"], referralTemplates },
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

window.freeGroups = freeGroups;
window.antibioticOptions = antibioticOptions;
window.referralTemplates = referralTemplates;
window.defaultDipironaAllergyReplacements = defaultDipironaAllergyReplacements;
window.escopolaminaDipironaAllergyReplacements = escopolaminaDipironaAllergyReplacements;
window.protocolsBase = protocolsBase;
