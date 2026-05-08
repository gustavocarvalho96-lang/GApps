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

function renderSimpleScore(parent, config) {
  var score = ensureScore(config.id, config.defaults || {});
  var box = div("score-box");
  var title = div("score-title");
  title.textContent = config.title;
  box.appendChild(title);
  var grid = div("score-grid");
  config.fields.forEach(function (field) {
    if (field.type === "number") grid.appendChild(smallNumberField(config.id, field.label, field.key, field.placeholder));
    if (field.type === "yesno") grid.appendChild(yesNoField(config.id, field.label, field.key, field.points));
    if (field.type === "option") grid.appendChild(optionField(config.id, field.label, field.key, field.options));
  });
  box.appendChild(grid);
  var result = config.result(score);
  var resultBox = div("score-result");
  resultBox.textContent = result.summary;
  box.appendChild(resultBox);
  box.appendChild(textButton("Inserir " + config.short, "text-btn primary-btn", function () {
    insertScoreLine(config.short, result.text);
    render();
  }));
  parent.appendChild(box);
}

function scoreConfigsFor(tab) {
  var configs = [];
  if (tab === "resp") {
    configs.push({
      id: "news2",
      short: "NEWS2",
      title: "NEWS2",
      fields: [
        { type: "option", key: "rr", label: "FR", options: [["3", "<=8"], ["1", "9-11"], ["0", "12-20"], ["2", "21-24"], ["3", ">=25"]] },
        { type: "option", key: "spo2", label: "Sat O2 escala 1", options: [["3", "<=91%"], ["2", "92-93%"], ["1", "94-95%"], ["0", ">=96%"]] },
        { type: "yesno", key: "oxygen", label: "Uso de O2", points: 2 },
        { type: "option", key: "sbp", label: "PAS", options: [["3", "<=90"], ["2", "91-100"], ["1", "101-110"], ["0", "111-219"], ["3", ">=220"]] },
        { type: "option", key: "pulse", label: "Pulso", options: [["3", "<=40"], ["1", "41-50"], ["0", "51-90"], ["1", "91-110"], ["2", "111-130"], ["3", ">=131"]] },
        { type: "option", key: "mental", label: "Consciência", options: [["0", "Alerta"], ["3", "Confusão/V/P/U"]] },
        { type: "option", key: "temp", label: "Temperatura", options: [["3", "<=35,0"], ["1", "35,1-36,0"], ["0", "36,1-38,0"], ["1", "38,1-39,0"], ["2", ">=39,1"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["rr", "spo2", "oxygen", "sbp", "pulse", "mental", "temp"]);
        var anyThree = ["rr", "spo2", "sbp", "pulse", "mental", "temp"].some(function (key) { return Number(s[key] || 0) === 3; });
        var risk = total >= 7 ? "alto" : total >= 5 || anyThree ? "medio" : total >= 1 ? "baixo" : "baixo/normal";
        return { summary: total + " pts - risco " + risk, text: "- NEWS2: " + total + " pts (risco " + risk + (anyThree ? "; parametro isolado = 3" : "") + ")." };
      }
    });
    configs.push({
      id: "qsofa",
      short: "qSOFA",
      title: "qSOFA",
      fields: [
        { type: "yesno", key: "fr", label: "FR >= 22" },
        { type: "yesno", key: "pas", label: "PAS <= 100" },
        { type: "yesno", key: "mental", label: "Alteracao mental / GCS < 15" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["fr", "pas", "mental"]);
        var risk = total >= 2 ? "risco aumentado" : "baixo risco pelo escore";
        return { summary: total + "/3 - " + risk, text: "- qSOFA: " + total + "/3 (" + risk + ")." };
      }
    });
    configs.push({
      id: "sirs",
      short: "SIRS",
      title: "SIRS",
      fields: [
        { type: "yesno", key: "temp", label: "Temp >38 ou <36" },
        { type: "yesno", key: "fc", label: "FC > 90" },
        { type: "yesno", key: "fr", label: "FR > 20" },
        { type: "yesno", key: "leuco", label: "Leuco >12000/<4000 ou desvio" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["temp", "fc", "fr", "leuco"]);
        var risk = total >= 2 ? "SIRS positivo" : "SIRS negativo";
        return { summary: total + "/4 - " + risk, text: "- SIRS: " + total + "/4 (" + risk + ")." };
      }
    });
    configs.push({
      id: "curb65",
      short: "CURB-65",
      title: "CURB-65 / CRB-65",
      fields: [
        { type: "yesno", key: "confusion", label: "Confusao" },
        { type: "yesno", key: "urea", label: "Ureia > 7 mmol/L" },
        { type: "yesno", key: "rr", label: "FR >= 30" },
        { type: "yesno", key: "bp", label: "PAS <90 ou PAD <=60" },
        { type: "yesno", key: "age", label: "Idade >= 65" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["confusion", "urea", "rr", "bp", "age"]);
        var risk = total <= 1 ? "baixo" : total === 2 ? "intermediario" : "alto";
        return { summary: total + "/5 - risco " + risk, text: "- CURB-65: " + total + "/5 (risco " + risk + ")." };
      }
    });
    configs.push({
      id: "psiport",
      short: "PSI/PORT",
      title: "PSI/PORT",
      fields: [
        { type: "number", key: "age", label: "Idade", placeholder: "anos" },
        { type: "option", key: "female", label: "Sexo", options: [["0", "Masculino"], ["-10", "Feminino (-10)"]] },
        { type: "yesno", key: "nursing", label: "Institucionalizado", points: 10 },
        { type: "yesno", key: "cancer", label: "Neoplasia", points: 30 },
        { type: "yesno", key: "liver", label: "Doença hepática", points: 20 },
        { type: "yesno", key: "chf", label: "Insuf. cardíaca", points: 10 },
        { type: "yesno", key: "cva", label: "Doença cerebrovascular", points: 10 },
        { type: "yesno", key: "renal", label: "Doença renal", points: 10 },
        { type: "yesno", key: "mental", label: "Alteração mental", points: 20 },
        { type: "yesno", key: "rr", label: "FR >=30", points: 20 },
        { type: "yesno", key: "sbp", label: "PAS <90", points: 20 },
        { type: "yesno", key: "temp", label: "Temp <35 ou >=40", points: 15 },
        { type: "yesno", key: "pulse", label: "Pulso >=125", points: 10 },
        { type: "yesno", key: "ph", label: "pH <7,35", points: 30 },
        { type: "yesno", key: "bun", label: "Ureia/BUN >=30 mg/dL", points: 20 },
        { type: "yesno", key: "na", label: "Na <130", points: 20 },
        { type: "yesno", key: "glucose", label: "Glicose >=250", points: 10 },
        { type: "yesno", key: "hct", label: "Ht <30%", points: 10 },
        { type: "yesno", key: "oxygen", label: "PaO2 <60 ou Sat <90", points: 10 },
        { type: "yesno", key: "effusion", label: "Derrame pleural", points: 10 }
      ],
      result: function (s) {
        var total = Math.max(0, (Number(s.age) || 0) + Number(s.female || 0) + scoreSum(s, ["nursing", "cancer", "liver", "chf", "cva", "renal", "mental", "rr", "sbp", "temp", "pulse", "ph", "bun", "na", "glucose", "hct", "oxygen", "effusion"]));
        var klass = total <= 50 ? "classe I" : total <= 70 ? "classe II" : total <= 90 ? "classe III" : total <= 130 ? "classe IV" : "classe V";
        var risk = total <= 70 ? "baixo" : total <= 90 ? "intermediario" : "alto";
        return { summary: total + " pts - " + klass + " / risco " + risk, text: "- PSI/PORT: " + total + " pts (" + klass + ", risco " + risk + ")." };
      }
    });
  }
  if (tab === "neuro") {
    configs.push({
      id: "glasgow",
      short: "Glasgow",
      title: "Escala de Glasgow",
      fields: [
        { type: "option", key: "ocular", label: "Ocular", options: [["4", "4 - espontanea"], ["3", "3 - voz"], ["2", "2 - dor"], ["1", "1 - nenhuma"]] },
        { type: "option", key: "verbal", label: "Verbal", options: [["5", "5 - orientado"], ["4", "4 - confuso"], ["3", "3 - palavras"], ["2", "2 - sons"], ["1", "1 - nenhuma"]] },
        { type: "option", key: "motor", label: "Motora", options: [["6", "6 - obedece"], ["5", "5 - localiza dor"], ["4", "4 - retira"], ["3", "3 - flexao"], ["2", "2 - extensao"], ["1", "1 - nenhuma"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["ocular", "verbal", "motor"]);
        var risk = total <= 8 ? "grave" : total <= 12 ? "moderado" : "leve/normal";
        return { summary: total + "/15 - " + risk, text: "- Glasgow: " + total + "/15 (" + risk + ")." };
      }
    });
    configs.push({
      id: "nihss",
      short: "NIHSS",
      title: "NIHSS",
      fields: [
        { type: "option", key: "loc", label: "Nivel consciencia", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]] },
        { type: "option", key: "questions", label: "Perguntas", options: [["0", "0"], ["1", "1"], ["2", "2"]] },
        { type: "option", key: "commands", label: "Comandos", options: [["0", "0"], ["1", "1"], ["2", "2"]] },
        { type: "option", key: "gaze", label: "Olhar", options: [["0", "0"], ["1", "1"], ["2", "2"]] },
        { type: "option", key: "visual", label: "Campo visual", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]] },
        { type: "option", key: "facial", label: "Paresia facial", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]] },
        { type: "option", key: "armL", label: "Braco E", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] },
        { type: "option", key: "armR", label: "Braco D", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] },
        { type: "option", key: "legL", label: "Perna E", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] },
        { type: "option", key: "legR", label: "Perna D", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] },
        { type: "option", key: "ataxia", label: "Ataxia", options: [["0", "0"], ["1", "1"], ["2", "2"]] },
        { type: "option", key: "sensory", label: "Sensibilidade", options: [["0", "0"], ["1", "1"], ["2", "2"]] },
        { type: "option", key: "language", label: "Linguagem", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]] },
        { type: "option", key: "dysarthria", label: "Disartria", options: [["0", "0"], ["1", "1"], ["2", "2"]] },
        { type: "option", key: "neglect", label: "Extincao/negligencia", options: [["0", "0"], ["1", "1"], ["2", "2"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["loc", "questions", "commands", "gaze", "visual", "facial", "armL", "armR", "legL", "legR", "ataxia", "sensory", "language", "dysarthria", "neglect"]);
        var risk = total <= 5 ? "leve" : total <= 15 ? "moderado" : total <= 20 ? "moderado-grave" : "grave";
        return { summary: total + "/42 - " + risk, text: "- NIHSS: " + total + "/42 (" + risk + ")." };
      }
    });
    configs.push({
      id: "cchr",
      short: "Canadian CT Head Rule",
      title: "Canadian CT Head Rule",
      fields: [
        { type: "yesno", key: "gcs2h", label: "GCS <15 em 2h" },
        { type: "yesno", key: "openFx", label: "Suspeita fratura aberta/deprimida" },
        { type: "yesno", key: "baseFx", label: "Sinais fratura base cranio" },
        { type: "yesno", key: "vomit", label: "Vomitos >=2" },
        { type: "yesno", key: "age", label: "Idade >=65" },
        { type: "yesno", key: "amnesia", label: "Amnesia >30 min" },
        { type: "yesno", key: "mechanism", label: "Mecanismo perigoso" }
      ],
      result: function (s) {
        var high = scoreSum(s, ["gcs2h", "openFx", "baseFx", "vomit", "age"]);
        var total = high + scoreSum(s, ["amnesia", "mechanism"]);
        var risk = total ? (high ? "TC indicada - alto risco" : "considerar TC - medio risco") : "sem criterio pelo CCHR";
        return { summary: risk, text: "- Canadian CT Head Rule: " + risk + "." };
      }
    });
    configs.push({
      id: "noc",
      short: "New Orleans Criteria",
      title: "New Orleans Criteria",
      fields: [
        { type: "yesno", key: "headache", label: "Cefaleia" },
        { type: "yesno", key: "vomit", label: "Vomito" },
        { type: "yesno", key: "age", label: "Idade >60" },
        { type: "yesno", key: "intox", label: "Intoxicacao" },
        { type: "yesno", key: "memory", label: "Deficit memoria curta" },
        { type: "yesno", key: "clavicle", label: "Trauma acima claviculas" },
        { type: "yesno", key: "seizure", label: "Convulsao" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["headache", "vomit", "age", "intox", "memory", "clavicle", "seizure"]);
        var risk = total ? "TC indicada se criterios aplicaveis" : "sem criterio pelo NOC";
        return { summary: total + " criterio(s) - " + risk, text: "- New Orleans Criteria: " + total + " criterio(s) (" + risk + ")." };
      }
    });
    configs.push({
      id: "ciwa",
      short: "CIWA-Ar",
      title: "CIWA-Ar",
      fields: [
        { type: "option", key: "nausea", label: "Nausea/vomitos", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "tremor", label: "Tremor", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "sweat", label: "Sudorese", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "anxiety", label: "Ansiedade", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "agitation", label: "Agitacao", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "tactile", label: "Tatil", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "auditory", label: "Auditivo", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "visual", label: "Visual", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "headache", label: "Cefaleia", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
        { type: "option", key: "orientation", label: "Orientacao", options: [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["nausea", "tremor", "sweat", "anxiety", "agitation", "tactile", "auditory", "visual", "headache", "orientation"]);
        var risk = total <= 8 ? "minima/leve" : total <= 15 ? "leve/moderada" : total <= 20 ? "moderada" : "grave";
        return { summary: total + "/67 - abstinencia " + risk, text: "- CIWA-Ar: " + total + "/67 (abstinencia " + risk + ")." };
      }
    });
  }
  if (tab === "abdome") {
    configs.push({
      id: "alvarado",
      short: "Alvarado",
      title: "Alvarado / MANTRELS",
      fields: [
        { type: "yesno", key: "migration", label: "Migracao para FID" },
        { type: "yesno", key: "anorexia", label: "Anorexia" },
        { type: "yesno", key: "nausea", label: "Nausea/vomitos" },
        { type: "yesno", key: "tender", label: "Dor FID", points: 2 },
        { type: "yesno", key: "rebound", label: "Descompressao" },
        { type: "yesno", key: "fever", label: "Temp >37,3" },
        { type: "yesno", key: "leuco", label: "Leuco >10000", points: 2 },
        { type: "yesno", key: "shift", label: "Desvio esquerda" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["migration", "anorexia", "nausea", "tender", "rebound", "fever", "leuco", "shift"]);
        var risk = total <= 4 ? "baixa probabilidade" : total <= 6 ? "compatível/observacao" : total <= 8 ? "provavel" : "muito provavel";
        return { summary: total + "/10 - " + risk, text: "- Alvarado: " + total + "/10 (" + risk + ")." };
      }
    });
    configs.push({
      id: "centor",
      short: "Centor/McIsaac",
      title: "Centor / McIsaac",
      defaults: { age: 0 },
      fields: [
        { type: "yesno", key: "fever", label: "Febre >38" },
        { type: "yesno", key: "noCough", label: "Ausencia de tosse" },
        { type: "yesno", key: "nodes", label: "Adenopatia cervical anterior" },
        { type: "yesno", key: "exudate", label: "Exsudato/edema tonsilar" },
        { type: "option", key: "age", label: "Idade", options: [["1", "3-14 anos (+1)"], ["0", "15-44 anos"], ["-1", ">=45 anos (-1)"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["fever", "noCough", "nodes", "exudate", "age"]);
        if (total < 0) total = 0;
        var risk = total <= 1 ? "baixo" : total <= 3 ? "intermediario" : "alto";
        return { summary: total + " pts - risco " + risk, text: "- Centor/McIsaac: " + total + " pts (risco " + risk + " para estreptococo)." };
      }
    });
  }
  if (tab === "tev") {
    configs.push({
      id: "wellsPe",
      short: "Wells TEP",
      title: "Wells para TEP",
      fields: [
        { type: "yesno", key: "dvt", label: "Sinais de TVP", points: 3 },
        { type: "yesno", key: "likely", label: "TEP mais provavel", points: 3 },
        { type: "yesno", key: "hr", label: "FC >100", points: 1.5 },
        { type: "yesno", key: "immob", label: "Imobilizacao/cirurgia", points: 1.5 },
        { type: "yesno", key: "prior", label: "TEP/TVP previa", points: 1.5 },
        { type: "yesno", key: "hemoptysis", label: "Hemoptise", points: 1 },
        { type: "yesno", key: "cancer", label: "Cancer ativo", points: 1 }
      ],
      result: function (s) {
        var total = scoreSum(s, ["dvt", "likely", "hr", "immob", "prior", "hemoptysis", "cancer"]);
        var risk = total <= 4 ? "TEP improvavel" : "TEP provavel";
        return { summary: total + " pts - " + risk, text: "- Wells TEP: " + total + " pts (" + risk + ")." };
      }
    });
    configs.push({
      id: "perc",
      short: "PERC",
      title: "PERC",
      fields: [
        { type: "yesno", key: "age", label: "Idade >=50" },
        { type: "yesno", key: "hr", label: "FC >=100" },
        { type: "yesno", key: "sat", label: "Sat <=94%" },
        { type: "yesno", key: "hemoptysis", label: "Hemoptise" },
        { type: "yesno", key: "estrogen", label: "Estrogenio" },
        { type: "yesno", key: "prior", label: "TEP/TVP previa" },
        { type: "yesno", key: "leg", label: "Edema unilateral" },
        { type: "yesno", key: "surgery", label: "Cirurgia/trauma 4 sem" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["age", "hr", "sat", "hemoptysis", "estrogen", "prior", "leg", "surgery"]);
        var risk = total === 0 ? "PERC negativo se baixa probabilidade pre-teste" : "PERC positivo";
        return { summary: total + "/8 - " + risk, text: "- PERC: " + total + "/8 (" + risk + ")." };
      }
    });
    configs.push({
      id: "wellsDvt",
      short: "Wells TVP",
      title: "Wells para TVP",
      fields: [
        { type: "yesno", key: "cancer", label: "Cancer ativo" },
        { type: "yesno", key: "paralysis", label: "Paralisia/imobilizacao MI" },
        { type: "yesno", key: "bed", label: "Acamado/cirurgia recente" },
        { type: "yesno", key: "tender", label: "Dor trajeto venoso" },
        { type: "yesno", key: "leg", label: "Perna inteira edemaciada" },
        { type: "yesno", key: "calf", label: "Panturrilha +3cm" },
        { type: "yesno", key: "pitting", label: "Edema cacifo unilateral" },
        { type: "yesno", key: "collateral", label: "Veias colaterais" },
        { type: "yesno", key: "prior", label: "TVP previa" },
        { type: "option", key: "alternative", label: "Diagnostico alternativo tao provavel", options: [["0", "Nao"], ["-2", "Sim (-2)"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["cancer", "paralysis", "bed", "tender", "leg", "calf", "pitting", "collateral", "prior", "alternative"]);
        var risk = total <= 0 ? "baixo" : total <= 2 ? "moderado" : "alto";
        return { summary: total + " pts - risco " + risk, text: "- Wells TVP: " + total + " pts (risco " + risk + ")." };
      }
    });
    configs.push({
      id: "spesi",
      short: "sPESI",
      title: "sPESI",
      fields: [
        { type: "yesno", key: "age", label: "Idade >80" },
        { type: "yesno", key: "cancer", label: "Cancer" },
        { type: "yesno", key: "cardiopulm", label: "Doenca cardiopulmonar" },
        { type: "yesno", key: "hr", label: "FC >=110" },
        { type: "yesno", key: "bp", label: "PAS <100" },
        { type: "yesno", key: "sat", label: "Sat <90%" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["age", "cancer", "cardiopulm", "hr", "bp", "sat"]);
        var risk = total === 0 ? "baixo risco" : "alto risco";
        return { summary: total + "/6 - " + risk, text: "- sPESI: " + total + "/6 (" + risk + ")." };
      }
    });
    configs.push({
      id: "pesi",
      short: "PESI",
      title: "PESI",
      fields: [
        { type: "number", key: "age", label: "Idade", placeholder: "anos" },
        { type: "yesno", key: "male", label: "Masculino", points: 10 },
        { type: "yesno", key: "cancer", label: "Cancer", points: 30 },
        { type: "yesno", key: "hf", label: "Insuf. cardiaca", points: 10 },
        { type: "yesno", key: "lung", label: "Doenca pulmonar cronica", points: 10 },
        { type: "yesno", key: "hr", label: "FC >=110", points: 20 },
        { type: "yesno", key: "bp", label: "PAS <100", points: 30 },
        { type: "yesno", key: "temp", label: "Temp <36", points: 20 },
        { type: "yesno", key: "rr", label: "FR >=30", points: 20 },
        { type: "yesno", key: "sat", label: "Sat <90%", points: 20 },
        { type: "yesno", key: "mental", label: "Alteracao mental", points: 60 }
      ],
      result: function (s) {
        var total = (Number(s.age) || 0) + scoreSum(s, ["male", "cancer", "hf", "lung", "hr", "bp", "temp", "rr", "sat", "mental"]);
        var risk = total <= 65 ? "classe I" : total <= 85 ? "classe II" : total <= 105 ? "classe III" : total <= 125 ? "classe IV" : "classe V";
        return { summary: total + " pts - " + risk, text: "- PESI: " + total + " pts (" + risk + ")." };
      }
    });
  }
  if (tab === "cardio") {
    configs.push({
      id: "chadsvasc",
      short: "CHA2DS2-VASc",
      title: "CHA2DS2-VASc",
      fields: [
        { type: "yesno", key: "chf", label: "IC/FE <=40%" },
        { type: "yesno", key: "has", label: "HAS" },
        { type: "option", key: "age", label: "Idade", options: [["0", "<65"], ["1", "65-74"], ["2", ">=75"]] },
        { type: "yesno", key: "dm", label: "Diabetes" },
        { type: "yesno", key: "stroke", label: "AVC/AIT/TE", points: 2 },
        { type: "yesno", key: "vascular", label: "Doenca vascular" },
        { type: "yesno", key: "female", label: "Sexo feminino" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["chf", "has", "age", "dm", "stroke", "vascular", "female"]);
        var risk = total === 0 ? "baixo" : total === 1 ? "baixo-intermediario" : "elevado";
        return { summary: total + " pts - risco " + risk, text: "- CHA2DS2-VASc: " + total + " pts (risco tromboembolico " + risk + ")." };
      }
    });
    configs.push({
      id: "hasbled",
      short: "HAS-BLED",
      title: "HAS-BLED",
      fields: [
        { type: "yesno", key: "htn", label: "HAS/PAS >160" },
        { type: "yesno", key: "renal", label: "Funcao renal alterada" },
        { type: "yesno", key: "liver", label: "Funcao hepatica alterada" },
        { type: "yesno", key: "stroke", label: "AVC previo" },
        { type: "yesno", key: "bleed", label: "Sangramento previo/predisposicao" },
        { type: "yesno", key: "inr", label: "INR labil" },
        { type: "yesno", key: "elderly", label: "Idade >65" },
        { type: "yesno", key: "drugs", label: "AINE/antiagregante" },
        { type: "yesno", key: "alcohol", label: "Alcool" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["htn", "renal", "liver", "stroke", "bleed", "inr", "elderly", "drugs", "alcohol"]);
        var risk = total >= 3 ? "alto risco de sangramento" : "baixo/moderado";
        return { summary: total + "/9 - " + risk, text: "- HAS-BLED: " + total + "/9 (" + risk + ")." };
      }
    });
  }
  return configs;
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
  var heart = div("score-box");
  var heartTitle = div("score-title");
  heartTitle.textContent = "HEART";
  heart.appendChild(heartTitle);
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
  var heartData = heartResult();
  heartResultBox.textContent = heartData.score + "/10 - risco " + heartData.risk;
  heart.appendChild(heartResultBox);
  heart.appendChild(textButton("Inserir HEART", "text-btn primary-btn", function () {
    insertScoreLine("HEART", heartResult().text);
    render();
  }));
  panel.appendChild(heart);

  var grace = div("score-box");
  var graceTitle = div("score-title");
  graceTitle.textContent = "GRACE";
  grace.appendChild(graceTitle);
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
  var graceData = graceResult();
  graceResultBox.textContent = graceData.score + " pts - risco " + graceData.risk;
  grace.appendChild(graceResultBox);
  grace.appendChild(textButton("Inserir GRACE", "text-btn primary-btn", function () {
    insertScoreLine("GRACE", graceResult().text);
    render();
  }));
  panel.appendChild(grace);
  }

  scoreConfigsFor(state.scores.tab).forEach(function (config) {
    renderSimpleScore(panel, config);
  });

  body.appendChild(panel);
}
