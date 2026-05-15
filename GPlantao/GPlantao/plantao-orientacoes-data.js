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
Tomar 1 cp de 8/8h se dor forte, ou se dor não melhorar com outras medicações.`],
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
