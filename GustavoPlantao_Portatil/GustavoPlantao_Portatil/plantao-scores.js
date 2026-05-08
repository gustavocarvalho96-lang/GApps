function scoreField(label, input) {
  var wrap = div("score-field");
  var title = document.createElement("label");
  title.textContent = label;
  wrap.appendChild(title);
  wrap.appendChild(input);
  return wrap;
}

function numberInput(value, placeholder, onInput) {
  var input = document.createElement("input");
  input.type = "number";
  input.inputMode = "decimal";
  input.placeholder = placeholder || "";
  input.value = value || "";
  input.oninput = function () { onInput(input.value); };
  input.onchange = render;
  return input;
}

function selectInput(value, options, onChange) {
  var select = document.createElement("select");
  options.forEach(function (option) {
    var opt = document.createElement("option");
    opt.value = option[0];
    opt.textContent = option[1];
    select.appendChild(opt);
  });
  select.value = String(value);
  select.onchange = function () { onChange(select.value); };
  return select;
}

function heartAgePoints(age) {
  age = Number(age);
  if (!age && age !== 0) return 0;
  if (age < 45) return 0;
  if (age < 65) return 1;
  return 2;
}

function heartResult() {
  var s = state.scores.heart;
  var score = Number(s.history) + Number(s.ecg) + heartAgePoints(s.age) + Number(s.riskFactors) + Number(s.troponin);
  var risk = score <= 3 ? "baixo" : score <= 6 ? "intermediario" : "alto";
  return {
    score: score,
    risk: risk,
    text: "- HEART: " + score + "/10 (" + risk + "). H " + s.history + ", ECG " + s.ecg + ", idade " + heartAgePoints(s.age) + ", fatores " + s.riskFactors + ", troponina " + s.troponin + "."
  };
}

function binScore(value, bins, emptyValue) {
  value = Number(value);
  if (!value && value !== 0) return emptyValue || 0;
  for (var i = 0; i < bins.length; i += 1) {
    if (value < bins[i][0]) return bins[i][1];
  }
  return bins[bins.length - 1][1];
}

function graceCreatininePoints(creatinineMgDl) {
  var cr = Number(creatinineMgDl);
  if (!cr && cr !== 0) return 0;
  var umol = cr * 88.4;
  if (umol <= 34) return 2;
  if (umol <= 70) return 5;
  if (umol <= 105) return 8;
  if (umol <= 140) return 11;
  if (umol <= 176) return 14;
  if (umol <= 353) return 23;
  return 31;
}

function graceResult() {
  var s = state.scores.grace;
  var age = binScore(s.age, [[40, 0], [50, 18], [60, 36], [70, 55], [80, 73], [999, 91]]);
  var hr = binScore(s.heartRate, [[70, 0], [90, 7], [110, 13], [150, 23], [200, 36], [999, 46]]);
  var sbp = binScore(s.systolicBp, [[80, 63], [100, 58], [120, 47], [140, 37], [160, 26], [200, 11], [999, 0]]);
  var cr = graceCreatininePoints(s.creatinine);
  var killip = [0, 0, 21, 43, 64][Number(s.killip)] || 0;
  var arrest = Number(s.arrest) ? 43 : 0;
  var st = Number(s.stDeviation) ? 30 : 0;
  var markers = Number(s.markers) ? 15 : 0;
  var score = age + hr + sbp + cr + killip + arrest + st + markers;
  var risk = score <= 108 ? "baixo (<1% intra-hospitalar)" : score <= 140 ? "intermediario (1-3% intra-hospitalar)" : "alto (>3% intra-hospitalar)";
  return {
    score: score,
    risk: risk,
    text: "- GRACE: " + score + " pts (" + risk + "). Idade " + age + ", FC " + hr + ", PAS " + sbp + ", Cr " + cr + ", Killip " + killip + ", PCR " + arrest + ", ST " + st + ", marcadores " + markers + "."
  };
}

function ensureScore(id, defaults) {
  if (!state.scores.items[id]) {
    state.scores.items[id] = {};
    Object.keys(defaults || {}).forEach(function (key) {
      state.scores.items[id][key] = defaults[key];
    });
  }
  return state.scores.items[id];
}

function yesNoField(scoreId, label, key, points) {
  var score = ensureScore(scoreId, {});
  if (score[key] === undefined) score[key] = 0;
  return scoreField(label, selectInput(score[key], [["0", "Nao"], [String(points || 1), "Sim"]], function (value) {
    score[key] = Number(value);
    render();
  }));
}

function optionField(scoreId, label, key, options) {
  var score = ensureScore(scoreId, {});
  if (score[key] === undefined) score[key] = Number(options[0][0]);
  return scoreField(label, selectInput(score[key], options, function (value) {
    score[key] = Number(value);
    render();
  }));
}

function smallNumberField(scoreId, label, key, placeholder) {
  var score = ensureScore(scoreId, {});
  if (score[key] === undefined) score[key] = "";
  return scoreField(label, numberInput(score[key], placeholder || "", function (value) {
    score[key] = value;
  }));
}

function scoreSum(score, keys) {
  return keys.reduce(function (sum, key) {
    return sum + Number(score[key] || 0);
  }, 0);
}

function scoreSuggestedConduct(id, result) {
  var summary = (result && result.summary ? result.summary : "").toLowerCase();
  var map = {
    heart: summary.indexOf("baixo") >= 0
      ? "se ECG/troponina seriada e contexto forem favoraveis, considerar alta com orientacoes e seguimento; se duvida clinica, manter observacao."
      : summary.indexOf("intermediario") >= 0
        ? "manter observacao, repetir ECG/troponina seriados, otimizar analgesia/antiagregacao conforme suspeita e considerar avaliacao cardiologica."
        : "tratar como alto risco para SCA, monitorizar, ECG/troponina seriados, terapia conforme protocolo local e avaliacao cardiologica/transferencia.",
    grace: summary.indexOf("baixo") >= 0
      ? "considerar estrategia conservadora/observacao conforme quadro, com reestratificacao clinica e exames seriados."
      : summary.indexOf("intermediario") >= 0
        ? "manter monitorizacao, tratamento anti-isquemico/antitrombotico conforme protocolo e discutir estratificacao invasiva conforme disponibilidade."
        : "alto risco: monitorizacao continua, terapia conforme SCA e avaliacao cardiologica precoce para estrategia invasiva/transferencia.",
    chadsvasc: summary.indexOf("baixo") >= 0
      ? "risco tromboembolico baixo; anticoagulacao geralmente nao indicada apenas pelo escore, individualizar."
      : "considerar anticoagulacao se fibrilacao atrial confirmada e sem contraindicoes, ponderando HAS-BLED e contexto clinico.",
    hasbled: summary.indexOf("alto") >= 0
      ? "corrigir fatores modificaveis de sangramento, revisar AINE/antiagregantes/alcool/PA e monitorar mais de perto se anticoagular."
      : "risco de sangramento baixo/moderado; nao contraindica anticoagulacao isoladamente, mas orientar e acompanhar.",
    news2: summary.indexOf("alto") >= 0
      ? "priorizar atendimento, monitorizacao continua, investigar sepse/hipoxia/choque e considerar sala de emergencia/transferencia."
      : summary.indexOf("medio") >= 0
        ? "reavaliar com prioridade, repetir sinais vitais, investigar foco infeccioso/hipoxia e considerar observacao."
        : "manter vigilancia clinica e repetir sinais vitais se sintomas persistirem ou houver piora.",
    qsofa: summary.indexOf("risco aumentado") >= 0
      ? "suspeitar sepse grave se infeccao provavel; priorizar avaliacao, lactato/exames, culturas se possivel e antibiotico/fluido conforme protocolo."
      : "baixo risco pelo escore, mas nao exclui sepse; correlacionar com clinica, NEWS2/SIRS/lactato e reavaliacao.",
    sirs: summary.indexOf("positivo") >= 0
      ? "se infeccao suspeita, investigar sepse, coletar exames conforme protocolo e iniciar tratamento do foco sem atraso indevido."
      : "SIRS negativo nao exclui infeccao grave; manter reavaliacao se contexto clinico preocupante.",
    curb65: summary.indexOf("alto") >= 0
      ? "pneumonia de alto risco: considerar internacao, antibiotico precoce, oxigenio se indicado e avaliacao de UTI se instabilidade."
      : summary.indexOf("intermediario") >= 0
        ? "considerar observacao/internacao curta conforme saturacao, comorbidades, suporte social e resposta inicial."
        : "baixo risco: considerar tratamento ambulatorial se sinais vitais, saturacao e contexto social forem seguros.",
    psiport: summary.indexOf("alto") >= 0
      ? "considerar internacao e monitorizacao; avaliar UTI se choque, hipoxemia, desconforto respiratorio ou comorbidades relevantes."
      : summary.indexOf("intermediario") >= 0
        ? "considerar observacao/internacao conforme saturacao, comorbidades e resposta inicial."
        : "baixo risco: considerar manejo ambulatorial se clinicamente estavel e com retorno garantido.",
    glasgow: summary.indexOf("grave") >= 0
      ? "priorizar ABC, protecao de via aerea se indicado, monitorizacao e neuroimagem/transferencia urgente."
      : summary.indexOf("moderado") >= 0
        ? "observar, monitorizar neurologico, investigar causa e considerar neuroimagem conforme contexto."
        : "manter reavaliacao neurologica e orientacoes de retorno se TCE/sintomas neurologicos.",
    nihss: summary.indexOf("leve") >= 0
      ? "acionar protocolo AVC se inicio agudo; mesmo deficit leve pode exigir imagem e avaliacao de reperfusao conforme janela."
      : "acionar protocolo AVC, checar glicemia, neuroimagem urgente e avaliar trombolise/trombectomia conforme janela e criterios.",
    cchr: summary.indexOf("sem criterio") >= 0
      ? "se regra aplicavel e exame clinico favoravel, considerar observacao/orientacoes sem TC; individualizar anticoagulacao/idoso."
      : "considerar TC de cranio e observacao conforme criterio positivo e exame neurologico.",
    noc: summary.indexOf("sem criterio") >= 0
      ? "se regra aplicavel, considerar observacao/orientacoes sem TC; manter baixo limiar se piora ou fatores de risco."
      : "considerar TC de cranio em TCE leve com criterio positivo.",
    ciwa: summary.indexOf("grave") >= 0 || summary.indexOf("moderada") >= 0
      ? "considerar benzodiazepinico conforme protocolo, tiamina antes de glicose se risco, monitorizacao e observacao/internacao."
      : "orientar, hidratar, considerar tiamina e reavaliar risco de progressao/convulsao conforme historia.",
    alvarado: summary.indexOf("provavel") >= 0
      ? "considerar avaliacao cirurgica, imagem conforme disponibilidade e analgesia/jejum se suspeita forte."
      : summary.indexOf("observacao") >= 0
        ? "manter observacao, reexame abdominal seriado e considerar imagem/laboratorio conforme evolucao."
        : "baixa probabilidade pelo escore; orientar retorno se dor migratoria/progressiva, febre ou vomitos.",
    centor: summary.indexOf("baixo") >= 0
      ? "evitar antibiotico empirico; sintomaticos e orientacoes, salvo sinais de gravidade ou contexto especial."
      : summary.indexOf("intermediario") >= 0
        ? "considerar teste rapido/cultura se disponivel; antibiotico conforme resultado ou alta suspeita local."
        : "alta probabilidade: considerar antibiotico conforme protocolo local e alergias, alem de analgesia/orientacoes.",
    bisap: summary.indexOf("alto") >= 0
      ? "pancreatite com maior risco: internar, hidratar conforme volemia, analgesia, monitorizar disfuncao organica e considerar UTI/transferencia se instabilidade."
      : summary.indexOf("moderado") >= 0
        ? "considerar internacao/observacao, analgesia, hidratacao guiada por volemia, exames seriados e imagem conforme evolucao."
        : "baixo risco pelo escore: analgesia, hidratacao conforme necessidade, dieta conforme tolerancia e reavaliacao clinica; internar se dor persistente, vomitos ou comorbidades.",
    ransonAdm: summary.indexOf("alto") >= 0
      ? "sugere pancreatite potencialmente grave: internar, monitorizar, hidratar conforme volemia e completar criterios em 48h; considerar UTI se disfuncao organica."
      : "risco inicial baixo/moderado: manter suporte clinico, analgesia, hidratacao conforme volemia e completar reavaliacao/laboratorio em 48h se internado.",
    tokyoChole: summary.indexOf("grau iii") >= 0
      ? "colecistite grave: reanimacao, antibiotico, suporte organico e avaliacao cirurgica/intervencionista urgente para controle de foco/transferencia."
      : summary.indexOf("grau ii") >= 0
        ? "colecistite moderada: internar, analgesia, antibiotico e avaliacao cirurgica precoce; considerar drenagem se alto risco cirurgico ou piora."
        : "colecistite leve: analgesia, antibiotico conforme protocolo, ultrassom/laboratorio e avaliacao cirurgica para colecistectomia precoce se disponivel.",
    tokyoCholangitis: summary.indexOf("grau iii") >= 0
      ? "colangite grave: reanimacao, antibiotico precoce, suporte organico e drenagem biliar urgente/transferencia."
      : summary.indexOf("grau ii") >= 0
        ? "colangite moderada: internar, antibiotico e drenagem biliar precoce apos estabilizacao."
        : "colangite leve: antibiotico, investigacao biliar e observar resposta; indicar drenagem se nao houver melhora ou houver obstrucao persistente.",
    gbs: summary.indexOf("muito baixo") >= 0
      ? "HDA de muito baixo risco: se estavel e sem outros sinais de gravidade, considerar alta com endoscopia/seguimento ambulatorial e orientacoes de retorno."
      : summary.indexOf("intermediario") >= 0
        ? "considerar observacao/internacao, acesso venoso, hemograma seriado, reposicao conforme perdas e endoscopia conforme disponibilidade."
        : "alto risco: reanimacao, acesso venoso calibroso, tipagem/provas, transfusao conforme limiares, internacao e endoscopia urgente conforme estabilidade.",
    wellsPe: summary.indexOf("provavel") >= 0
      ? "seguir fluxo de TEP provavel: imagem diagnostica prioritária e considerar anticoagulacao se alta suspeita e baixo risco de sangramento."
      : "TEP improvavel: considerar D-dimero se baixa/intermediaria probabilidade e imagem se D-dimero positivo ou clinica persistente.",
    perc: summary.indexOf("negativo") >= 0
      ? "se probabilidade pre-teste baixa, pode evitar D-dimero/imagem; se suspeita maior, PERC nao se aplica."
      : "PERC positivo: nao exclui TEP; prosseguir com D-dimero ou imagem conforme probabilidade pre-teste.",
    wellsDvt: summary.indexOf("alto") >= 0
      ? "considerar ultrassom venoso e anticoagulacao se alta suspeita e baixo risco de sangramento enquanto aguarda confirmacao."
      : summary.indexOf("moderado") >= 0
        ? "considerar D-dimero/ultrassom conforme disponibilidade e contexto."
        : "baixo risco: considerar D-dimero e seguimento se negativo; reavaliar se piora.",
    spesi: summary.indexOf("baixo") >= 0
      ? "baixo risco em TEP confirmado; considerar alta precoce apenas se estavel, sem hipoxemia, com suporte e anticoagulacao segura."
      : "alto risco pelo sPESI: considerar internacao/observacao, avaliar VD/troponina e risco de deterioracao.",
    pesi: summary.indexOf("classe i") >= 0 || summary.indexOf("classe ii") >= 0
      ? "baixo risco em TEP confirmado; considerar manejo ambulatorial apenas se criterios clinicos e sociais forem seguros."
      : "risco aumentado: considerar internacao, monitorizacao e estratificacao com VD/troponina conforme estabilidade."
  };
  return map[id] || "";
}

function scoreTextWithConduct(id, result) {
  var conduct = scoreSuggestedConduct(id, result);
  return result.text + (conduct ? "\n  Conduta sugerida: " + conduct : "");
}

function renderSimpleScore(parent, config) {
  var score = ensureScore(config.id, config.defaults || {});
  var result = config.result(score);
  var isOpen = !!state.scores.open[config.id];
  var box = div("score-box" + (isOpen ? " open" : ""));
  var head = div("score-box-head");
  var toggle = textButton((isOpen ? "▼ " : "▶ ") + config.title, "score-toggle", function () {
    state.scores.open[config.id] = !state.scores.open[config.id];
    render();
  });
  var summary = div("score-summary");
  summary.textContent = result.summary;
  head.appendChild(toggle);
  head.appendChild(summary);
  box.appendChild(head);
  if (!isOpen) {
    parent.appendChild(box);
    return;
  }
  var grid = div("score-grid");
  config.fields.forEach(function (field) {
    if (field.type === "number") grid.appendChild(smallNumberField(config.id, field.label, field.key, field.placeholder));
    if (field.type === "yesno") grid.appendChild(yesNoField(config.id, field.label, field.key, field.points));
    if (field.type === "option") grid.appendChild(optionField(config.id, field.label, field.key, field.options));
  });
  box.appendChild(grid);
  var resultBox = div("score-result");
  resultBox.textContent = result.summary;
  box.appendChild(resultBox);
  var conduct = scoreSuggestedConduct(config.id, result);
  if (conduct) {
    var conductBox = div("score-conduct");
    conductBox.textContent = "Conduta sugerida: " + conduct;
    box.appendChild(conductBox);
  }
  box.appendChild(textButton("Inserir " + config.short, "text-btn primary-btn", function () {
    insertScoreLine(config.short, scoreTextWithConduct(config.id, result));
    render();
  }));
  parent.appendChild(box);
}

function renderCardioScore(parent, id, title, summary, renderBody) {
  var isOpen = !!state.scores.open[id];
  var box = div("score-box" + (isOpen ? " open" : ""));
  var head = div("score-box-head");
  var toggle = textButton((isOpen ? "▼ " : "▶ ") + title, "score-toggle", function () {
    state.scores.open[id] = !state.scores.open[id];
    render();
  });
  var summaryBox = div("score-summary");
  summaryBox.textContent = summary;
  head.appendChild(toggle);
  head.appendChild(summaryBox);
  box.appendChild(head);
  if (isOpen) renderBody(box);
  parent.appendChild(box);
}

function scoreConfigsFor(tab) {
  if (tab === "cardio") return scoreConfigsCardio();
  if (tab === "resp") return scoreConfigsRespiratorio();
  if (tab === "neuro") return scoreConfigsNeuro();
  if (tab === "abdome") return scoreConfigsAbdome();
  if (tab === "tev") return scoreConfigsTev();
  return [];
}

function insertScoreLine(label, line) {
  var text = state.editableText || "";
  var scoreMarker = "--> Scores :";
  var conductMarker = "--> Conduta";
  var lines;
  if (text.indexOf(scoreMarker) < 0) {
    var insert = "\n" + scoreMarker + "\n" + line + "\n";
    var conductIndex = text.indexOf(conductMarker);
    state.editableText = conductIndex >= 0
      ? text.slice(0, conductIndex).trimEnd() + "\n" + insert + "\n" + text.slice(conductIndex).trimStart()
      : text.trimEnd() + "\n" + insert;
    return;
  }
  lines = text.split("\n");
  var markerIndex = lines.indexOf(scoreMarker);
  var replaced = false;
  for (var i = markerIndex + 1; i < lines.length; i += 1) {
    if (lines[i].indexOf("--> ") === 0) break;
    if (lines[i].indexOf("- " + label + ":") === 0) {
      lines[i] = line;
      replaced = true;
      break;
    }
  }
  if (!replaced) lines.splice(markerIndex + 1, 0, line);
  state.editableText = lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function renderScorePanel(body) {
  var panel = div("panel stack score-panel");
  var title = div("panel-title");
  title.textContent = "Scores";
  panel.appendChild(title);

  var tabs = div("score-tabs");
  [
    ["cardio", "Cardio"],
    ["resp", "Resp/Infecção"],
    ["neuro", "Neuro"],
    ["abdome", "Abdome/Oro"],
    ["tev", "TEV"]
  ].forEach(function (item) {
    tabs.appendChild(textButton(item[1], "text-btn" + (state.scores.tab === item[0] ? " active" : ""), function () {
      state.scores.tab = item[0];
      render();
    }));
  });
  panel.appendChild(tabs);

  if (state.scores.tab === "cardio") {
  var heartData = heartResult();
  renderCardioScore(panel, "heart", "HEART", heartData.score + "/10 - risco " + heartData.risk, function (heart) {
  var heartGrid = div("score-grid");
  heartGrid.appendChild(scoreField("Historia", selectInput(state.scores.heart.history, [["0", "0 - pouco/nada sugestiva"], ["1", "1 - moderada"], ["2", "2 - muito sugestiva"]], function (value) {
    state.scores.heart.history = Number(value);
    render();
  })));
  heartGrid.appendChild(scoreField("ECG", selectInput(state.scores.heart.ecg, [["0", "0 - normal"], ["1", "1 - inespecifico"], ["2", "2 - ST significativo"]], function (value) {
    state.scores.heart.ecg = Number(value);
    render();
  })));
  heartGrid.appendChild(scoreField("Idade", numberInput(state.scores.heart.age, "anos", function (value) {
    state.scores.heart.age = value;
  })));
  heartGrid.appendChild(scoreField("Fatores", selectInput(state.scores.heart.riskFactors, [["0", "0 - nenhum"], ["1", "1 - 1 a 2"], ["2", "2 - >=3/DAC"]], function (value) {
    state.scores.heart.riskFactors = Number(value);
    render();
  })));
  heartGrid.appendChild(scoreField("Troponina", selectInput(state.scores.heart.troponin, [["0", "0 - normal"], ["1", "1 - 1 a 3x"], ["2", "2 - >3x"]], function (value) {
    state.scores.heart.troponin = Number(value);
    render();
  })));
  heart.appendChild(heartGrid);
  var heartResultBox = div("score-result");
  heartResultBox.textContent = heartData.score + "/10 - risco " + heartData.risk;
  heart.appendChild(heartResultBox);
  var heartConduct = scoreSuggestedConduct("heart", { summary: heartResultBox.textContent, text: heartData.text });
  if (heartConduct) {
    var heartConductBox = div("score-conduct");
    heartConductBox.textContent = "Conduta sugerida: " + heartConduct;
    heart.appendChild(heartConductBox);
  }
  heart.appendChild(textButton("Inserir HEART", "text-btn primary-btn", function () {
    insertScoreLine("HEART", scoreTextWithConduct("heart", heartResult()));
    render();
  }));
  });

  var graceData = graceResult();
  renderCardioScore(panel, "grace", "GRACE", graceData.score + " pts - risco " + graceData.risk, function (grace) {
  var graceGrid = div("score-grid");
  graceGrid.appendChild(scoreField("Idade", numberInput(state.scores.grace.age, "anos", function (value) {
    state.scores.grace.age = value;
  })));
  graceGrid.appendChild(scoreField("FC", numberInput(state.scores.grace.heartRate, "bpm", function (value) {
    state.scores.grace.heartRate = value;
  })));
  graceGrid.appendChild(scoreField("PAS", numberInput(state.scores.grace.systolicBp, "mmHg", function (value) {
    state.scores.grace.systolicBp = value;
  })));
  graceGrid.appendChild(scoreField("Creatinina", numberInput(state.scores.grace.creatinine, "mg/dL", function (value) {
    state.scores.grace.creatinine = value;
  })));
  graceGrid.appendChild(scoreField("Killip", selectInput(state.scores.grace.killip, [["1", "I"], ["2", "II"], ["3", "III"], ["4", "IV"]], function (value) {
    state.scores.grace.killip = Number(value);
    render();
  })));
  graceGrid.appendChild(scoreField("PCR adm.", selectInput(state.scores.grace.arrest, [["0", "Nao"], ["1", "Sim"]], function (value) {
    state.scores.grace.arrest = Number(value);
    render();
  })));
  graceGrid.appendChild(scoreField("Desvio ST", selectInput(state.scores.grace.stDeviation, [["0", "Nao"], ["1", "Sim"]], function (value) {
    state.scores.grace.stDeviation = Number(value);
    render();
  })));
  graceGrid.appendChild(scoreField("Marcadores", selectInput(state.scores.grace.markers, [["0", "Nao"], ["1", "Sim"]], function (value) {
    state.scores.grace.markers = Number(value);
    render();
  })));
  grace.appendChild(graceGrid);
  var graceResultBox = div("score-result");
  graceResultBox.textContent = graceData.score + " pts - risco " + graceData.risk;
  grace.appendChild(graceResultBox);
  var graceConduct = scoreSuggestedConduct("grace", { summary: graceResultBox.textContent, text: graceData.text });
  if (graceConduct) {
    var graceConductBox = div("score-conduct");
    graceConductBox.textContent = "Conduta sugerida: " + graceConduct;
    grace.appendChild(graceConductBox);
  }
  grace.appendChild(textButton("Inserir GRACE", "text-btn primary-btn", function () {
    insertScoreLine("GRACE", scoreTextWithConduct("grace", graceResult()));
    render();
  }));
  });
  }

  scoreConfigsFor(state.scores.tab).forEach(function (config) {
    renderSimpleScore(panel, config);
  });

  body.appendChild(panel);
}
