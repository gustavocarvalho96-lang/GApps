var quickOrder = ["anamnese", "reavaliacao", "encaminhamento", "antibioticos", "receita-livre", "administrativo"];
var editableIds = ["administrativo", "anamnese", "reavaliacao", "encaminhamento", "receita-livre"];
var state = {
  selectedId: "administrativo",
  selectedOption: 0,
  selectedOrientationOption: 0,
  selectedAntibiotic: 0,
  selectedReferral: 0,
  referralMode: "ambulatorial",
  anamneseGender: "feminino",
  editableText: "",
  search: "",
  labInput: "",
  labOutput: "",
  scores: {
    heart: { history: 0, ecg: 0, age: "", riskFactors: 0, troponin: 0 },
    grace: { age: "", heartRate: "", systolicBp: "", creatinine: "", killip: 1, arrest: 0, stDeviation: 0, markers: 0 },
    tab: "cardio",
    items: {}
  },
  useParacetamolAlt: false,
  useEscopolaminaParacetamolAlt: false,
  useGastroCipro: false,
  openGroups: { dor: false, gastro: false, resp: false, antibiotics: false, orientacoes: false, otoOro: false, psych: false, scores: false }
};

function el(id) {
  return document.getElementById(id);
}

function isEditable(id) {
  return editableIds.indexOf(id) >= 0;
}

function textButton(label, className, onClick) {
  var b = document.createElement("button");
  b.type = "button";
  b.className = className || "text-btn";
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

function dotButton(label, onClick, active) {
  var b = document.createElement("button");
  b.type = "button";
  b.className = "dot-btn" + (active ? " active" : "");
  var dot = document.createElement("span");
  dot.className = "dot";
  var txt = document.createElement("span");
  txt.textContent = label;
  b.appendChild(dot);
  b.appendChild(txt);
  b.onclick = onClick;
  return b;
}

function div(className) {
  var d = document.createElement("div");
  d.className = className || "";
  return d;
}

function getProtocols() {
  if (window.protocolsBase && Array.isArray(window.protocolsBase)) return window.protocolsBase;
  return [];
}

function getInitialText(protocol) {
  if (!protocol) return "";
  if (protocol.referralTemplates) return buildReferralText(protocol.referralTemplates && protocol.referralTemplates[0], "ambulatorial");
  if (protocol.genderedTemplate) return applyAnamneseGender(protocol.prescription || "", state.anamneseGender);
  return protocol.prescription || "";
}

function selectProtocol(id) {
  state.selectedId = id;
  state.selectedOption = 0;
  state.selectedOrientationOption = 0;
  state.selectedAntibiotic = 0;
  state.selectedReferral = 0;
  state.referralMode = "ambulatorial";
  state.useParacetamolAlt = false;
  state.useEscopolaminaParacetamolAlt = false;
  state.useGastroCipro = false;
  state.openGroups = { dor: false, gastro: false, resp: false, antibiotics: false, orientacoes: false, otoOro: false, psych: false, scores: false };
  var protocol = findProtocol(id);
  state.editableText = getInitialText(protocol);
  render();
}

function findProtocol(id) {
  var protocols = getProtocols();
  for (var i = 0; i < protocols.length; i += 1) {
    if (protocols[i].id === id) return protocols[i];
  }
  return protocols[0] || null;
}

function filtered() {
  var protocols = getProtocols();
  var term = state.search.toLowerCase().trim();
  var base = protocols.filter(function (item) {
    if (!term) return true;
    return [item.title, item.category, item.prescription, item.orientation, (item.tags || []).join(" ")].join(" ").toLowerCase().indexOf(term) >= 0;
  });
  var quick = base.filter(function (item) { return quickOrder.indexOf(item.id) >= 0; }).sort(function (a, b) {
    return quickOrder.indexOf(a.id) - quickOrder.indexOf(b.id);
  });
  var recipes = base.filter(function (item) { return quickOrder.indexOf(item.id) < 0; }).sort(function (a, b) {
    return a.title.localeCompare(b.title, "pt-BR");
  });
  return { quick: quick, recipes: recipes, all: quick.concat(recipes) };
}

function currentProtocol() {
  var lists = filtered();
  for (var i = 0; i < lists.all.length; i += 1) {
    if (lists.all[i].id === state.selectedId) return lists.all[i];
  }
  return lists.all[0] || findProtocol(state.selectedId);
}

function renderNav(containerId, items, selectedId, emptyText) {
  var node = el(containerId);
  if (!node) return;
  node.innerHTML = "";
  if (!items.length) {
    var empty = div("empty-note");
    empty.textContent = emptyText || "Nenhum item.";
    node.appendChild(empty);
    return;
  }
  for (var i = 0; i < items.length; i += 1) {
    (function (item) {
      var b = textButton("", "nav-btn" + (item.id === selectedId ? " active" : ""), function () {
        selectProtocol(item.id);
      });
      var title = document.createElement("span");
      title.className = "nav-title";
      title.textContent = item.title;
      var meta = document.createElement("span");
      meta.className = "nav-meta";
      meta.textContent = item.category || "";
      b.appendChild(title);
      b.appendChild(meta);
      node.appendChild(b);
    })(items[i]);
  }
}

function buildReferralText(template, mode) {
  if (!template) return "";
  var urgencyText = mode === "urgente"
    ? "Solicito avaliacao com prioridade/urgencia conforme disponibilidade do servico."
    : mode === "investigacao"
      ? "Solicito avaliacao para investigacao complementar e definicao de conduta."
      : "Solicito avaliacao ambulatorial conforme disponibilidade da rede.";
  return "Encaminho para avaliacao em " + template.specialty + "\n\n" +
    "Hipotese diagnostica: " + template.hypothesis + "\n\n" +
    "Resumo clinico:\n" + template.summary + "\n\n" +
    "Exames relevantes:\n" + template.exams + "\n\n" +
    "Conduta ja realizada:\n" + template.conduct + "\n\n" +
    "Prioridade / finalidade:\n" + urgencyText + "\n\n" +
    "Solicito avaliacao especializada e seguimento.";
}

function applyReplacements(text, replacements) {
  (replacements || []).forEach(function (pair) {
    text = text.replaceAll(pair[0], pair[1]);
  });
  return text;
}

function getPrescription(protocol) {
  if (!protocol) return "";
  if (isEditable(protocol.id)) return state.editableText;
  var base = protocol.prescription || "";
  if (protocol.antibioticOptions) {
    base = (protocol.antibioticOptions[state.selectedAntibiotic] || protocol.antibioticOptions[0]).value || "";
  } else if (protocol.options && protocol.options.length) {
    base = (protocol.options[state.selectedOption] || protocol.options[0]).value || "";
  }
  (protocol.addOns || []).forEach(function (addOn) {
    if (state[addOn.stateKey]) base += addOn.text || "";
  });
  if (state.useParacetamolAlt) {
    base = applyReplacements(base, window.defaultDipironaAllergyReplacements);
    base = applyReplacements(base, protocol.allergyReplacements);
  }
  if (state.useEscopolaminaParacetamolAlt) {
    base = applyReplacements(base, window.escopolaminaDipironaAllergyReplacements);
  }
  return base;
}

function finalText(protocol) {
  var prescription = getPrescription(protocol);
  if (isEditable(protocol.id)) return prescription;
  var orientation = getOrientation(protocol);
  return prescription + (orientation ? "\n\nORIENTACOES\n" + orientation : "");
}

function getOrientation(protocol) {
  if (!protocol) return "";
  if (protocol.orientationOptions && protocol.orientationOptions.length) {
    return (protocol.orientationOptions[state.selectedOrientationOption] || protocol.orientationOptions[0]).value || "";
  }
  return protocol.orientation || "";
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    var area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }
}

function addTextToEditable(label, text) {
  var lower = state.editableText.toLowerCase();
  if (lower.indexOf(label.toLowerCase()) >= 0) {
    state.editableText = state.editableText.replace(text, "").replace(/\n{3,}/g, "\n\n").trimEnd();
  } else {
    state.editableText = state.editableText.trimEnd() + "\n\n" + text;
  }
  render();
}

function applyAnamneseGender(text, gender) {
  var isMale = gender === "masculino";
  var replacements = isMale
    ? [
      [/\bCorada\b/g, "Corado"],
      [/\bHidratada\b/g, "Hidratado"],
      [/\bAcianótica\b/g, "Acianótico"],
      [/\bAcianotica\b/g, "Acianotico"],
      [/\bAnicterica\b/g, "Anicterico"],
      [/\bAnictérica\b/g, "Anictérico"],
      [/\bEupneica\b/g, "Eupneico"]
    ]
    : [
      [/\bCorado\b/g, "Corada"],
      [/\bHidratado\b/g, "Hidratada"],
      [/\bAcianótico\b/g, "Acianótica"],
      [/\bAcianotico\b/g, "Acianotica"],
      [/\bAnicterico\b/g, "Anicterica"],
      [/\bAnictérico\b/g, "Anictérica"],
      [/\bEupneico\b/g, "Eupneica"]
    ];
  replacements.forEach(function (item) {
    text = text.replace(item[0], item[1]);
  });
  return text;
}

function setAnamneseGender(gender) {
  state.anamneseGender = gender;
  state.editableText = applyAnamneseGender(state.editableText || getInitialText(findProtocol("anamnese")), gender);
  render();
}

function toggleAnamneseExam(text) {
  var current = state.editableText || "";
  if (current.indexOf(text) >= 0) {
    state.editableText = current.replace(text, "").replace(/\n{3,}/g, "\n\n").trimEnd();
  } else {
    var conductMarker = "--> Conduta";
    var conductIndex = current.indexOf(conductMarker);
    if (conductIndex >= 0) {
      state.editableText = current.slice(0, conductIndex).trimEnd() + "\n" + text + "\n\n" + current.slice(conductIndex).trimStart();
    } else {
      state.editableText = current.trimEnd() + "\n" + text;
    }
  }
  render();
}

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

function transcribeCurrentLabs(input, source) {
  state.labInput = input ? input.value : state.labInput;
  state.labOutput = source === "jundiai" ? transcribeJundiaiLabs(state.labInput) : transcribeCampoLimpoLabs(state.labInput);
}

function insertLabOutputIntoReavaliacao() {
  var output = state.labOutput || transcribeLabs(state.labInput);
  state.labOutput = output;
  if (!output) return;
  var text = state.editableText || "";
  var labsMarker = "-->Exames labs:";
  var imageMarker = "-->Exames imagem:";
  var labsIndex = text.indexOf(labsMarker);
  var imageIndex = text.indexOf(imageMarker);
  if (labsIndex >= 0 && imageIndex > labsIndex) {
    state.editableText =
      text.slice(0, labsIndex + labsMarker.length).trimEnd() +
      "\n" + output + "\n\n" +
      text.slice(imageIndex).trimStart();
    return;
  }
  state.editableText = text.trimEnd() + "\n\nEXAMES:\n" + output;
}

function renderOptions(protocol, parent) {
  if (isEditable(protocol.id)) {
    var resetRow = div("section row");
    resetRow.appendChild(textButton("Limpar template", "text-btn", function () {
      state.editableText = getInitialText(protocol);
      state.labInput = "";
      state.labOutput = "";
      render();
    }));
    if (protocol.labSources) {
      protocol.labSources.forEach(function (source) {
        resetRow.appendChild(textButton(source.label, "text-btn lab-source-btn " + source.className, function () {
          transcribeCurrentLabs(null, source.source);
          render();
        }));
      });
    }
    if (protocol.genderedTemplate) {
      resetRow.appendChild(textButton("Masculino", "text-btn" + (state.anamneseGender === "masculino" ? " active" : ""), function () {
        setAnamneseGender("masculino");
      }));
      resetRow.appendChild(textButton("Feminino", "text-btn" + (state.anamneseGender === "feminino" ? " active" : ""), function () {
        setAnamneseGender("feminino");
      }));
    }
    parent.appendChild(resetRow);

    if (protocol.snippets && protocol.snippets.standardExam) {
      var otoOroBlock = div("section toggle-block");
      var anamneseButtons = div("row");
      var snippets = protocol.snippets || {};
      var standardExam = snippets.standardExam && snippets.standardExam.text;
      var psychSnippets = snippets.psych || [];
      var psychActive = psychSnippets.some(function (item) {
        return (state.editableText || "").indexOf(item[1]) >= 0;
      });
      anamneseButtons.appendChild(textButton((snippets.standardExam && snippets.standardExam.label) || "Padrão", "text-btn" + (standardExam && (state.editableText || "").indexOf(standardExam) >= 0 ? " active" : ""), function () {
        toggleAnamneseExam(standardExam);
      }));
      anamneseButtons.appendChild(textButton("Oto/Oro", "text-btn", function () {
        state.openGroups.otoOro = !state.openGroups.otoOro;
        render();
      }));
      anamneseButtons.appendChild(textButton("Psiq", "text-btn" + (state.openGroups.psych || psychActive ? " active" : ""), function () {
        state.openGroups.psych = !state.openGroups.psych;
        render();
      }));
      anamneseButtons.appendChild(textButton("Scores", "text-btn" + (state.openGroups.scores ? " active" : ""), function () {
        state.openGroups.scores = !state.openGroups.scores;
        render();
      }));
      otoOroBlock.appendChild(anamneseButtons);
      if (state.openGroups.otoOro) {
        var examRow = div("row");
        (snippets.otoOro || []).forEach(function (item) {
          examRow.appendChild(textButton(item[0], "text-btn" + ((state.editableText || "").indexOf(item[1]) >= 0 ? " active" : ""), function () {
            toggleAnamneseExam(item[1]);
          }));
        });
        otoOroBlock.appendChild(examRow);
      }
      if (state.openGroups.psych) {
        var psychRow = div("row");
        psychSnippets.forEach(function (item) {
          psychRow.appendChild(textButton(item[0], "text-btn" + ((state.editableText || "").indexOf(item[1]) >= 0 ? " active" : ""), function () {
            toggleAnamneseExam(item[1]);
          }));
        });
        otoOroBlock.appendChild(psychRow);
      }
      if (state.openGroups.scores) renderScorePanel(otoOroBlock);
      parent.appendChild(otoOroBlock);
    }
  }

  if (Array.isArray(protocol.snippets)) {
    var admin = div("section row");
    (protocol.snippets || []).forEach(function (item) {
      admin.appendChild(dotButton(item[0], function () {
        state.editableText = item[1];
        render();
      }));
    });
    parent.appendChild(admin);
  }

  if (protocol.antibioticOptions) {
    var row = div("section row");
    protocol.antibioticOptions.forEach(function (opt, index) {
      row.appendChild(dotButton(opt.label, function () {
        state.selectedAntibiotic = index;
        render();
      }, index === state.selectedAntibiotic));
    });
    parent.appendChild(row);
  }
  if (protocol.options && protocol.options.length) {
    var row2 = div("section row");
    protocol.options.forEach(function (opt, index) {
      row2.appendChild(dotButton(opt.label, function () {
        state.selectedOption = index;
        render();
      }, index === state.selectedOption));
    });
    parent.appendChild(row2);
  }
  if (protocol.orientationOptions && protocol.orientationOptions.length) {
    var orientationRow = div("section row");
    protocol.orientationOptions.forEach(function (opt, index) {
      orientationRow.appendChild(dotButton(opt.label, function () {
        state.selectedOrientationOption = index;
        render();
      }, index === state.selectedOrientationOption));
    });
    parent.appendChild(orientationRow);
  }
  if (protocol.referralTemplates) {
    var refs = div("section stack");
    var r1 = div("row");
    protocol.referralTemplates.forEach(function (template, index) {
      r1.appendChild(dotButton(template.label, function () {
        state.selectedReferral = index;
        state.editableText = buildReferralText(template, state.referralMode);
        render();
      }, index === state.selectedReferral));
    });
    var r2 = div("row");
    [["Avaliacao ambulatorial", "ambulatorial"], ["Avaliacao urgente", "urgente"], ["Investigacao complementar", "investigacao"]].forEach(function (item) {
      r2.appendChild(dotButton(item[0], function () {
        state.referralMode = item[1];
        state.editableText = buildReferralText(protocol.referralTemplates[state.selectedReferral], state.referralMode);
        render();
      }, item[1] === state.referralMode));
    });
    refs.appendChild(r1);
    refs.appendChild(r2);
    parent.appendChild(refs);
  }
  (protocol.addOns || []).forEach(function (addOn) {
    var row = div("section row");
    row.appendChild(textButton(state[addOn.stateKey] ? addOn.removeLabel : addOn.addLabel, "text-btn" + (state[addOn.stateKey] ? " active" : ""), function () {
      state[addOn.stateKey] = !state[addOn.stateKey];
      render();
    }));
    parent.appendChild(row);
  });
  var currentPrescription = getPrescription(protocol);
  var hasStandaloneDipirona = /dipirona/i.test(currentPrescription.replace(/Escopolamina \+ dipirona/gi, ""));
  if (!isEditable(protocol.id) && (hasStandaloneDipirona || state.useParacetamolAlt)) {
    var troca = div("section row");
    troca.appendChild(textButton(state.useParacetamolAlt ? "Voltar para dipirona" : "Alergia a dipirona", "text-btn" + (state.useParacetamolAlt ? " active" : ""), function () {
      state.useParacetamolAlt = !state.useParacetamolAlt;
      render();
    }));
    parent.appendChild(troca);
  }
  if (!isEditable(protocol.id) && (/escopolamina \+ dipirona/i.test(currentPrescription) || state.useEscopolaminaParacetamolAlt)) {
    var trocaEscopolamina = div("section row");
    trocaEscopolamina.appendChild(textButton(state.useEscopolaminaParacetamolAlt ? "Voltar para escopolamina + dipirona" : "Alergia a dipirona", "text-btn" + (state.useEscopolaminaParacetamolAlt ? " active" : ""), function () {
      state.useEscopolaminaParacetamolAlt = !state.useEscopolaminaParacetamolAlt;
      render();
    }));
    parent.appendChild(trocaEscopolamina);
  }
}

function renderFreeGroups(body) {
  var box = div("stack free-groups");
  var tabs = div("free-topic-row");
  var content = div("free-topic-content");
  [["dor", "Dor/Febre"], ["gastro", "Nausea/Gastro"], ["resp", "Alergia/Respiratorio"], ["antibiotics", "Antibioticos"], ["orientacoes", "Orientacoes/Sinais de Alarme"]].forEach(function (group) {
    var key = group[0];
    tabs.appendChild(textButton(group[1], "text-btn free-topic-btn" + (state.openGroups[key] ? " active" : ""), function () {
      state.openGroups[key] = !state.openGroups[key];
      render();
    }));
    if (state.openGroups[key]) {
      var row = div("row");
      var source = key === "antibiotics"
        ? ((window.antibioticOptions || []).map(function (o) { return [o.label, o.value]; }))
        : ((window.freeGroups && window.freeGroups[key]) || []);
      source.slice().sort(function (a, b) { return a[0].localeCompare(b[0], "pt-BR"); }).forEach(function (item) {
        row.appendChild(dotButton(item[0], function () {
          var text = key === "antibiotics" ? item[1].replace(/^\s*Uso oral:\s*/i, "") : item[1];
          addTextToEditable(item[0], text);
        }));
      });
      content.appendChild(row);
    }
  });
  box.appendChild(tabs);
  if (content.children.length) box.appendChild(content);
  body.appendChild(box);
}

function renderEditable(protocol, body) {
  if (protocol.freeGroupsEnabled) renderFreeGroups(body);
  if (protocol.labTranscription) {
    var lab = div("panel stack");
    var label = div("panel-title");
    label.textContent = "Transcricao de exames laboratoriais";
    var input = document.createElement("textarea");
    input.className = "small";
    input.placeholder = "Cole aqui o texto do exame";
    input.value = state.labInput || "";
    input.oninput = function () { state.labInput = input.value; };
    input.onkeydown = function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        transcribeCurrentLabs(input);
        render();
      }
    };
    var output = document.createElement("pre");
    output.textContent = state.labOutput || "Cole o exame acima e clique em Transcrever exames.";
    var actions = div("row");
    actions.appendChild(textButton("Copiar resultado", "text-btn", function () {
      transcribeCurrentLabs(input);
      copyText(state.labOutput);
      render();
    }));
    actions.appendChild(textButton("Inserir exames", "text-btn", function () {
      transcribeCurrentLabs(input);
      insertLabOutputIntoReavaliacao();
      render();
    }));
    actions.appendChild(textButton("Limpar exames", "text-btn", function () {
      state.labInput = "";
      state.labOutput = "";
      render();
    }));
    lab.appendChild(label);
    lab.appendChild(input);
    lab.appendChild(actions);
    var preview = div("panel");
    preview.appendChild(output);
    lab.appendChild(preview);
    body.appendChild(lab);
  }
  var area = document.createElement("textarea");
  area.value = state.editableText;
  area.oninput = function () { state.editableText = area.value; };
  body.appendChild(area);
}

function renderProtocol(protocol) {
  var content = el("content");
  content.innerHTML = "";
  if (!protocol) return;
  if (isEditable(protocol.id) && state.editableText === "") state.editableText = getInitialText(protocol);

  var card = div("card");
  var header = div("header");
  var titleBox = div("");
  var h = document.createElement("h1");
  h.textContent = protocol.title;
  var p = document.createElement("p");
  p.textContent = protocol.category || "";
  titleBox.appendChild(h);
  titleBox.appendChild(p);
  var actions = div("header-actions");
  actions.appendChild(textButton("Copiar tudo", "text-btn primary-btn", function () { copyText(finalText(protocol)); }));
  var headerLeft = div("header-left");
  headerLeft.appendChild(titleBox);
  headerLeft.appendChild(actions);
  header.appendChild(headerLeft);
  card.appendChild(header);
  renderOptions(protocol, card);

  var body = div("body stack");
  if (isEditable(protocol.id)) {
    renderEditable(protocol, body);
  } else {
    var panel = div("panel");
    var t = div("panel-title");
    t.textContent = "Receita";
    var pre = document.createElement("pre");
    pre.textContent = getPrescription(protocol);
    panel.appendChild(t);
    panel.appendChild(pre);
    body.appendChild(panel);
    var orientation = getOrientation(protocol);
    if (orientation) {
      var orient = div("panel");
      var ot = div("panel-title");
      ot.textContent = "Orientacoes";
      var op = document.createElement("pre");
      op.textContent = orientation;
      orient.appendChild(ot);
      orient.appendChild(op);
      body.appendChild(orient);
    }
  }
  card.appendChild(body);
  content.appendChild(card);
}

function render() {
  var lists = filtered();
  var protocol = currentProtocol();
  if (protocol) state.selectedId = protocol.id;
  renderNav("quickList", lists.quick, state.selectedId, "Nenhuma acao rapida.");
  renderNav("recipeList", lists.recipes, state.selectedId, "Nenhuma receita encontrada.");
  renderProtocol(protocol);
}

function boot() {
  var protocols = getProtocols();
  if (!protocols.length) {
    el("content").textContent = "Erro: dados do app nao foram carregados.";
    return;
  }
  state.selectedId = protocols[0].id;
  state.editableText = getInitialText(protocols[0]);
  var search = el("search");
  if (search) {
    search.oninput = function () {
      state.search = search.value || "";
      render();
    };
  }
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (search) search.focus();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (state.selectedId === "reavaliacao" && event.target && event.target.className === "small") return;
      event.preventDefault();
      copyText(finalText(currentProtocol()));
    }
  });
  render();
}

boot();
