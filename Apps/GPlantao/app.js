var quickOrder = ["anamnese", "reavaliacao", "internacao", "encaminhamento", "antibioticos", "receita-livre", "administrativo"];
var editableIds = ["administrativo", "anamnese", "reavaliacao", "internacao", "encaminhamento", "receita-livre"];
var ANAMNESE_STORAGE_KEY = "gplantao-anamnese-draft-v1";
var REAVALIACAO_STORAGE_KEY = "gplantao-reavaliacao-draft-v1";
var ALLERGY_STORAGE_KEY = "gplantao-allergies-v1";
var ALLERGY_OPTIONS = [
  "Diclofenaco",
  "Dipirona",
  "Paracetamol",
  "Escopolamina",
  "AAS",
  "Amoxicilina",
  "Azitromicina",
  "Benzetacil",
  "Cefalexina",
  "Ceftriaxona",
  "Cetoprofeno",
  "Ciprofloxacino",
  "Claritromicina",
  "Clindamicina",
  "Codeina",
  "Dexametasona",
  "Hidrocortisona",
  "Ibuprofeno",
  "Loratadina",
  "Metoclopramida",
  "Morfina",
  "Naproxeno",
  "Nimesulida",
  "Omeprazol",
  "Ondansetrona",
  "Penicilina",
  "Prednisona",
  "Sulfametoxazol-trimetoprima",
  "Tramadol"
];
var ANAMNESE_ATTESTATION_OPTIONS = [
  {
    label: "IVAS 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com infeccao de vias aereas superiores, com sintomas respiratorios que limitam temporariamente suas atividades laborais e risco de transmissao no periodo sintomatico inicial. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "GECA 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro gastrointestinal agudo, com sintomas que limitam temporariamente suas atividades laborais e demandam repouso, hidratacao e tratamento sintomatico. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Dor 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro algico, com limitacao funcional temporaria para suas atividades laborais habituais. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Enxaqueca 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com cefaleia/enxaqueca, com sintomas que limitam temporariamente suas atividades laborais e demandam repouso e tratamento sintomatico. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Dengue 3d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com sindrome febril aguda/suspeita de dengue, com sintomas sistemicos que limitam temporariamente suas atividades laborais e demandam repouso, hidratacao e acompanhamento clinico. Atesto afastamento por 3 dias, a contar desta data."
  },
  {
    label: "Conjuntivite 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro ocular compativel com conjuntivite, com sintomas locais e potencial risco de transmissao conforme evolucao clinica. Necessita afastamento temporario de suas atividades laborais. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "Sinusite 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com rinossinusite aguda, com sintomas respiratorios e dor/desconforto facial que limitam temporariamente suas atividades laborais. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "Amigdalite 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com faringoamigdalite aguda, com odinofagia e sintomas sistemicos que limitam temporariamente suas atividades laborais. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "Otite 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com otalgia/otite, com dor e desconforto que limitam temporariamente suas atividades laborais. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Lombalgia 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro algico lombar, com limitacao funcional temporaria para suas atividades laborais habituais, especialmente esforco fisico, flexao de tronco ou permanencia prolongada em uma mesma posicao. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "Colica renal 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com colica renal, com dor intensa e limitacao funcional temporaria para suas atividades laborais. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "ITU 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro urinario agudo, com sintomas que limitam temporariamente suas atividades laborais e demandam tratamento e hidratacao. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Vertigem 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro clinico compativel com vertigem/tontura, com instabilidade e limitacao temporaria para atividades laborais, especialmente as que exigem deslocamento, equilibrio, conducao de veiculos ou operacao de maquinas. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Gastrite 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro gastrointestinal alto, com dor/desconforto epigastrico e sintomas associados que limitam temporariamente suas atividades laborais. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Escabiose 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro dermatologico compativel com escabiose, necessitando tratamento e medidas de controle de transmissao. Atesto afastamento por 1 dia, a contar desta data."
  },
  {
    label: "Herpes zoster 3d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro dermatologico doloroso compativel com herpes zoster, com dor e desconforto que limitam temporariamente suas atividades laborais. Atesto afastamento por 3 dias, a contar desta data."
  },
  {
    label: "Gota 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro inflamatorio articular agudo, com dor e limitacao funcional temporaria para deambulacao e atividades laborais habituais. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "Pele infeccao 2d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro de infeccao de pele/partes moles, com dor, sinais inflamatorios locais e necessidade de tratamento, repouso relativo e acompanhamento clinico. Atesto afastamento por 2 dias, a contar desta data."
  },
  {
    label: "Hemorr/fissura 1d",
    text: "Atestado medico: Paciente avaliado(a) em atendimento medico, apresentando quadro anorretal doloroso, com sintomas que limitam temporariamente suas atividades laborais e demandam tratamento sintomatico e medidas locais. Atesto afastamento por 1 dia, a contar desta data."
  }
];
var state = {
  selectedId: "administrativo",
  selectedOption: 0,
  selectedOrientationOption: 0,
  selectedAntibiotic: 0,
  selectedReferral: 0,
  referralMode: "ambulatorial",
  anamneseGender: "feminino",
  editableText: "",
  anamneseVitals: { pa: "", fc: "", fr: "", sato2: "" },
  reavaliacaoVitals: { pa: "", fc: "", fr: "", sato2: "" },
  labInput: "",
  labOutput: "",
  labSource: "auto",
  labDetectedSource: "",
  allergies: [],
  allergyMenuOpen: false,
  atestaditeSidebarVisible: false,
  atestaditeTexts: {},
  scores: {
    heart: { history: 0, ecg: 0, age: "", riskFactors: 0, troponin: 0 },
    grace: { age: "", heartRate: "", systolicBp: "", creatinine: "", killip: 1, arrest: 0, stDeviation: 0, markers: 0 },
    tab: "cardio",
    open: {},
    items: {}
  },
  useParacetamolAlt: false,
  useEscopolaminaParacetamolAlt: false,
  useGastroCipro: false,
  openGroups: { dor: false, gastro: false, resp: false, antibiotics: false, orientacoes: false, atestadite: false, otoOro: false, psych: false, scores: false, atestado: false }
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
  if (protocol.atestaditeSections) return buildAtestaditeText(protocol);
  if (protocol.referralTemplates) return buildReferralText(protocol.referralTemplates && protocol.referralTemplates[0], "ambulatorial");
  if (protocol.genderedTemplate) return applyAnamneseGender(protocol.prescription || "", state.anamneseGender);
  return protocol.prescription || "";
}

function loadAnamneseDraft(protocol) {
  var fallback = getInitialText(protocol);
  try {
    var stored = localStorage.getItem(ANAMNESE_STORAGE_KEY);
    if (!stored) return fallback;
    var payload = JSON.parse(stored);
    if (payload && (payload.gender === "masculino" || payload.gender === "feminino")) {
      state.anamneseGender = payload.gender;
    }
    if (payload && payload.vitals) {
      state.anamneseVitals = {
        pa: payload.vitals.pa || "",
        fc: payload.vitals.fc || "",
        fr: payload.vitals.fr || "",
        sato2: payload.vitals.sato2 || ""
      };
    }
    return payload && typeof payload.text === "string" ? normalizeAnamneseVitalsText(payload.text, null) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveAnamneseDraft(message) {
  if (state.selectedId !== "anamnese") return;
  try {
    localStorage.setItem(ANAMNESE_STORAGE_KEY, JSON.stringify({
      text: state.editableText || "",
      gender: state.anamneseGender,
      vitals: state.anamneseVitals || { pa: "", fc: "", fr: "", sato2: "" },
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    // Autosave silencioso: se o navegador bloquear o storage, a anamnese segue em memoria.
  }
}

function loadReavaliacaoDraft(protocol) {
  var fallback = getInitialText(protocol);
  try {
    var stored = localStorage.getItem(REAVALIACAO_STORAGE_KEY);
    if (!stored) return fallback;
    var payload = JSON.parse(stored);
    if (payload && payload.vitals) {
      state.reavaliacaoVitals = {
        pa: payload.vitals.pa || "",
        fc: payload.vitals.fc || "",
        fr: payload.vitals.fr || "",
        sato2: payload.vitals.sato2 || ""
      };
    }
    state.labInput = payload && typeof payload.labInput === "string" ? payload.labInput : "";
    state.labOutput = payload && typeof payload.labOutput === "string" ? payload.labOutput : "";
    state.labSource = payload && typeof payload.labSource === "string" ? payload.labSource : "auto";
    state.labDetectedSource = payload && typeof payload.labDetectedSource === "string" ? payload.labDetectedSource : "";
    return payload && typeof payload.text === "string" ? payload.text : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveReavaliacaoDraft() {
  if (state.selectedId !== "reavaliacao") return;
  try {
    localStorage.setItem(REAVALIACAO_STORAGE_KEY, JSON.stringify({
      text: state.editableText || "",
      vitals: state.reavaliacaoVitals || { pa: "", fc: "", fr: "", sato2: "" },
      labInput: state.labInput || "",
      labOutput: state.labOutput || "",
      labSource: state.labSource || "auto",
      labDetectedSource: state.labDetectedSource || "",
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    // Autosave silencioso: se o navegador bloquear o storage, a reavaliacao segue em memoria.
  }
}

function clearReavaliacaoDraft() {
  try {
    localStorage.removeItem(REAVALIACAO_STORAGE_KEY);
  } catch (error) {}
}

function loadAllergies() {
  try {
    var stored = localStorage.getItem(ALLERGY_STORAGE_KEY);
    var parsed = stored ? JSON.parse(stored) : [];
    state.allergies = Array.isArray(parsed) ? parsed.filter(function (item) {
      return ALLERGY_OPTIONS.indexOf(item) >= 0;
    }) : [];
  } catch (error) {
    state.allergies = [];
  }
}

function saveAllergies() {
  try {
    localStorage.setItem(ALLERGY_STORAGE_KEY, JSON.stringify(state.allergies || []));
  } catch (error) {}
}

function formatAnamneseAllergies() {
  return (state.allergies || []).join(" | ");
}

function setAnamneseAllergyLine(text, allergyText) {
  var allergiesText = typeof allergyText === "string" ? allergyText : formatAnamneseAllergies();
  if (/-->\s*Alergia[ \t]*:/i.test(text)) {
    return text.replace(/(-->\s*Alergia[ \t]*:[ \t]*).*/i, function (_, prefix) {
      return prefix + allergiesText;
    });
  }
  return "--> Alergia : " + allergiesText + "\n" + text;
}

function updateAnamneseAllergiesInTemplate(shouldSave, sourceText) {
  state.editableText = setAnamneseAllergyLine(typeof sourceText === "string" ? sourceText : (state.editableText || ""));
  if (shouldSave !== false) saveAnamneseDraft("Anamnese salva");
}

function updateVisibleAnamneseAllergyLine() {
  var editor = document.querySelector("textarea.anamnese-editor");
  if (!editor) return;
  updateAnamneseAllergiesInTemplate(true, editor.value);
  editor.value = state.editableText;
}

function toggleAllergy(medicine) {
  var current = state.allergies || [];
  if (current.indexOf(medicine) >= 0) {
    state.allergies = current.filter(function (item) { return item !== medicine; });
  } else {
    state.allergies = current.concat(medicine);
  }
  saveAllergies();
  updateVisibleAnamneseAllergyLine();
  renderAllergyControls();
}

function renderAllergyControls() {
  var toggle = el("allergyToggle");
  var menu = el("allergyMenu");
  var alert = el("allergyAlert");
  var allergies = state.allergies || [];
  if (toggle) {
    toggle.textContent = allergies.length ? "Alergia (" + allergies.length + ")" : "Alergia";
    toggle.classList.toggle("active", allergies.length > 0);
    toggle.setAttribute("aria-expanded", state.allergyMenuOpen ? "true" : "false");
  }
  if (menu) {
    menu.innerHTML = "";
    menu.classList.toggle("hidden", !state.allergyMenuOpen);
    ALLERGY_OPTIONS.forEach(function (medicine) {
      menu.appendChild(textButton(medicine, "allergy-option" + (allergies.indexOf(medicine) >= 0 ? " active" : ""), function () {
        toggleAllergy(medicine);
      }));
    });
    if (allergies.length) {
      menu.appendChild(textButton("Limpar alergias", "allergy-option allergy-clear", function () {
        state.allergies = [];
        saveAllergies();
        updateVisibleAnamneseAllergyLine();
        renderAllergyControls();
      }));
    }
  }
  if (alert) {
    alert.classList.toggle("hidden", allergies.length === 0);
    alert.textContent = allergies.length ? "ALERGIA: " + allergies.join(" | ") : "";
  }
  var editor = document.querySelector("textarea.anamnese-editor");
  var allergyText = allergies.join(" | ");
  if (editor && editor.value !== setAnamneseAllergyLine(editor.value, allergyText)) {
    state.editableText = setAnamneseAllergyLine(editor.value, allergyText);
    editor.value = state.editableText;
    saveAnamneseDraft("Anamnese salva");
  }
}

function clearAllSavedData() {
  if (!window.confirm("Limpar todos os saves do GPlantao?")) return;
  try {
    for (var i = localStorage.length - 1; i >= 0; i -= 1) {
      var key = localStorage.key(i);
      if (key && key.indexOf("gplantao-") === 0) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {}

  state.reavaliacaoVitals = { pa: "", fc: "", fr: "", sato2: "" };
  state.labInput = "";
  state.labOutput = "";
  state.labSource = "auto";
  state.labDetectedSource = "";
  state.anamneseGender = "feminino";
  state.anamneseVitals = { pa: "", fc: "", fr: "", sato2: "" };
  state.allergies = [];
  state.allergyMenuOpen = false;

  var protocol = currentProtocol();
  state.editableText = getInitialText(protocol);
  showToast("Saves limpos");
  render();
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
  state.anamneseVitals = { pa: "", fc: "", fr: "", sato2: "" };
  state.reavaliacaoVitals = { pa: "", fc: "", fr: "", sato2: "" };
  state.labInput = "";
  state.labOutput = "";
  state.labSource = "auto";
  state.labDetectedSource = "";
  state.openGroups = { dor: false, gastro: false, resp: false, antibiotics: false, orientacoes: false, atestadite: false, otoOro: false, psych: false, scores: false, atestado: false };
  var protocol = findProtocol(id);
  state.atestaditeTexts = protocol && protocol.atestaditeSections ? getAtestaditeInitialTexts(protocol) : {};
  state.editableText = protocol && protocol.id === "anamnese"
    ? loadAnamneseDraft(protocol)
    : protocol && protocol.id === "reavaliacao"
      ? loadReavaliacaoDraft(protocol)
      : getInitialText(protocol);
  if (protocol && protocol.id === "anamnese") updateAnamneseAllergiesInTemplate(false);
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
  var atestadite = protocols.filter(function (item) { return item.atestadite === true; }).sort(function (a, b) {
    return a.title.localeCompare(b.title, "pt-BR");
  });
  var recipes = protocols.filter(function (item) { return quickOrder.indexOf(item.id) < 0 && item.atestadite !== true; }).sort(function (a, b) {
    return a.title.localeCompare(b.title, "pt-BR");
  });
  return { quick: quick, atestadite: atestadite, recipes: recipes, all: quick.concat(atestadite, recipes) };
}

function currentProtocol() {
  return findProtocol(state.selectedId);
}

function getAtestaditeInitialTexts(protocol) {
  var texts = {};
  (protocol.atestaditeSections || []).forEach(function (section) {
    texts[section.key] = section.text || "";
  });
  return texts;
}

function buildAtestaditeText(protocol) {
  var source = Object.keys(state.atestaditeTexts || {}).length ? state.atestaditeTexts : getAtestaditeInitialTexts(protocol);
  return (protocol.atestaditeSections || []).map(function (section) {
    if (section.copySeparate) return "";
    var text = source[section.key] || "";
    return text.trim();
  }).filter(function (text) {
    return text.trim();
  }).join("\n\n");
}

function getAtestaditeSectionText(section) {
  return ((state.atestaditeTexts || {})[section.key] || section.text || "").trim();
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
  if (protocol && protocol.atestaditeSections) return buildAtestaditeText(protocol);
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
  saveAnamneseDraft("Anamnese salva");
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
  saveAnamneseDraft("Anamnese salva");
  render();
}

function formatAnamneseVitals() {
  var vitals = state.anamneseVitals || {};
  var parts = [];
  if (vitals.pa) parts.push("PA " + vitals.pa + " mmHg");
  if (vitals.fc) parts.push("FC " + vitals.fc + " bpm");
  if (vitals.fr) parts.push("FR " + vitals.fr + " irpm");
  if (vitals.sato2) parts.push("SATO2 " + vitals.sato2 + "%");
  return parts.length ? parts.join(" | ") : "PA | FC | FR | SATO2";
}

function normalizeAnamneseVitalsText(text, replacement) {
  var next = text || "";
  next = next.replace(/(--> Ao exame fisico\s*:\s*)\([^)]*\)\.?/i, "$1");
  next = next.replace(/^\s*\(PA[^)]*\)\.\s*$/gim, "");
  next = next.replace(/\n{3,}/g, "\n\n");
  if (!replacement) return next;
  var conductPattern = /\n\s*--> Conduta\s*:/i;
  if (conductPattern.test(next)) {
    return next.replace(conductPattern, "\n" + replacement + "\n\n--> Conduta :");
  }
  return next.trimEnd() + "\n" + replacement;
}

function updateAnamneseVitalsInTemplate() {
  var replacement = "(" + formatAnamneseVitals() + ").";
  state.editableText = normalizeAnamneseVitalsText(state.editableText || "", replacement);
  saveAnamneseDraft("Anamnese salva");
}

function removeAnamneseAttestationBlock(text) {
  var lines = (text || "").split("\n");
  var next = [];
  var skipping = false;
  for (var i = 0; i < lines.length; i += 1) {
    var line = lines[i];
    if (/^\s*Atestado medico:/i.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping && /^\s*$/.test(line)) continue;
    if (skipping && /^\s*(?:\d+\s*-|-->)/.test(line)) {
      skipping = false;
      next.push(line);
      continue;
    }
    if (!skipping) next.push(line);
  }
  return next.join("\n").replace(/\n{3,}/g, "\n\n");
}

function setAnamneseAttestationBlock(text, attestationText) {
  var next = removeAnamneseAttestationBlock(text || "");
  if (!attestationText) return next;
  var conductPattern = /(-->\s*Conduta\s*:\s*)/i;
  if (conductPattern.test(next)) {
    return next.replace(conductPattern, function (marker) {
      return marker + "\n" + attestationText + "\n\n";
    }).replace(/\n{3,}/g, "\n\n");
  }
  return next.trimEnd() + "\n\n--> Conduta :\n" + attestationText;
}

function updateAnamneseAttestationInTemplate(attestationText) {
  var editor = document.querySelector("textarea.anamnese-editor");
  var source = editor ? editor.value : state.editableText;
  state.editableText = setAnamneseAttestationBlock(source || "", attestationText);
  if (editor) editor.value = state.editableText;
  saveAnamneseDraft("Anamnese salva");
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
  saveAnamneseDraft("Anamnese salva");
  render();
}

function boot() {
  var protocols = getProtocols();
  if (!protocols.length) {
    el("content").textContent = "Erro: dados do app nao foram carregados.";
    return;
  }
  loadAllergies();
  var initialProtocol = findProtocol("anamnese") || protocols[0];
  state.selectedId = initialProtocol.id;
  state.editableText = initialProtocol.id === "anamnese" ? loadAnamneseDraft(initialProtocol) : getInitialText(initialProtocol);
  if (initialProtocol.id === "anamnese") updateAnamneseAllergiesInTemplate(false);
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (state.selectedId === "reavaliacao" && event.target && event.target.className === "small") return;
      event.preventDefault();
      copyText(finalText(currentProtocol()));
    }
  });
  var clearSavedDataBtn = el("clearSavedDataBtn");
  if (clearSavedDataBtn) {
    clearSavedDataBtn.addEventListener("click", clearAllSavedData);
  }
  document.addEventListener("click", function (event) {
    var control = document.querySelector(".allergy-control");
    if (!control || control.contains(event.target)) return;
    if (!state.allergyMenuOpen) return;
    state.allergyMenuOpen = false;
    renderAllergyControls();
  });
  render();
}

boot();
