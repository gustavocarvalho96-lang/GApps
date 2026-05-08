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
  var quick = protocols.filter(function (item) { return quickOrder.indexOf(item.id) >= 0; }).sort(function (a, b) {
    return quickOrder.indexOf(a.id) - quickOrder.indexOf(b.id);
  });
  var recipes = protocols.filter(function (item) { return quickOrder.indexOf(item.id) < 0; }).sort(function (a, b) {
    return a.title.localeCompare(b.title, "pt-BR");
  });
  return { quick: quick, recipes: recipes, all: quick.concat(recipes) };
}

function currentProtocol() {
  return findProtocol(state.selectedId);
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

function boot() {
  var protocols = getProtocols();
  if (!protocols.length) {
    el("content").textContent = "Erro: dados do app nao foram carregados.";
    return;
  }
  var initialProtocol = findProtocol("anamnese") || protocols[0];
  state.selectedId = initialProtocol.id;
  state.editableText = getInitialText(initialProtocol);
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (state.selectedId === "reavaliacao" && event.target && event.target.className === "small") return;
      event.preventDefault();
      copyText(finalText(currentProtocol()));
    }
  });
  render();
}

boot();
