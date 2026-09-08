function transcribeCurrentLabs(input, source) {
  state.labInput = input ? input.value : state.labInput;
  state.labSource = source || "auto";
  if (state.labSource === "auto") {
    var result = transcribeAutomaticLabs(state.labInput);
    state.labDetectedSource = result.label;
    state.labOutput = result.output;
    return;
  }
  if (state.labSource === "jundiai") {
    state.labDetectedSource = "Jundiai";
    state.labOutput = transcribeJundiaiLabs(state.labInput);
    return;
  }
  if (state.labSource === "sobam") {
    state.labDetectedSource = "SOBAM";
    state.labOutput = transcribeSobamLabs(state.labInput);
    return;
  }
  state.labDetectedSource = "Campo Limpo";
  state.labOutput = transcribeCampoLimpoLabs(state.labInput);
}

function labSourceLabel() {
  if (state.labSource === "auto")
    return "Auto: " + (state.labDetectedSource || "aguardando detecção");
  if (state.labSource === "jundiai") return "Jundiai";
  if (state.labSource === "sobam") return "SOBAM";
  return "Campo Limpo";
}

var HIGH_RISK_MEDICATION_OPTIONS = [
  { label: "Morfina", indication: "analgesia e controle de dor importante" },
  { label: "Tramal", indication: "analgesia e controle de dor importante" }
];

function highRiskText(option) {
  return (
    "Paciente reavaliado as ______ apos administracao de " +
    option.label +
    ", indicada por necessidade clinica de analgesia e controle de dor importante. No momento, apresenta resposta terapeutica satisfatoria  sinais vitais: PA | FC | FR | SATO2, nivel de consciencia preservado, responsivo, dor EVA __/10 , sem sinais de depressao respiratoria, rebaixamento persistente do nivel de consciencia, hipotensao, dessaturacao ou outros eventos adversos. Sem necessidade de dose adicional ou mudanca de conduta no momento."
  );
}

function formatReavaliacaoVitals() {
  var vitals = state.reavaliacaoVitals || {};
  var parts = [];
  if (vitals.pa) parts.push("PA " + vitals.pa + " mmHg");
  if (vitals.fc) parts.push("FC " + vitals.fc + " bpm");
  if (vitals.fr) parts.push("FR " + vitals.fr + " irpm");
  if (vitals.sato2) parts.push("SATO2 " + vitals.sato2 + "%");
  return parts.length ? parts.join(" | ") : "PA | FC | FR | SATO2";
}

function normalizeReavaliacaoPa(value) {
  var cleaned = (value || "").trim();
  var digits = cleaned.replace(/\D/g, "");
  if (/^\d{4,6}$/.test(digits)) {
    return digits.slice(0, digits.length - 2) + "x" + digits.slice(-2);
  }
  return cleaned;
}

function updateReavaliacaoVitalsInTemplate() {
  var replacement = "(" + formatReavaliacaoVitals() + ")";
  var text = state.editableText || "";
  var hemodynamicPattern = /(paciente est.vel hemodinamicamente\s*)\([^)]*\)/i;
  if (hemodynamicPattern.test(text)) {
    state.editableText = text.replace(hemodynamicPattern, function (match, prefix) {
      return prefix + replacement;
    });
    saveReavaliacaoDraft();
    return;
  }
  state.editableText = text.replace(/paciente est.vel hemodinamicamente/i, function (match) {
    return match + " " + replacement;
  });
  saveReavaliacaoDraft();
}

function removeHighRiskReavaliacaoBlock(text) {
  var lines = (text || "").split("\n");
  var next = [];
  var skipping = false;
  for (var i = 0; i < lines.length; i += 1) {
    var line = lines[i];
    if (/^\s*Paciente reavaliado apos administracao de .*medicacao de alto risco/i.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping && /^\s*$/.test(line)) continue;
    if (skipping && /^\s*#/.test(line)) {
      skipping = false;
      next.push(line);
      continue;
    }
    if (!skipping) next.push(line);
  }
  return next.join("\n").replace(/\n{3,}/g, "\n\n");
}

function setHighRiskReavaliacaoBlock(text, blockText) {
  var next = removeHighRiskReavaliacaoBlock(text || "");
  if (!blockText) return next;
  var conductPattern = /\n\s*#\s*Conduta\s*:/i;
  if (conductPattern.test(next)) {
    return next
      .replace(conductPattern, "\n" + blockText + "\n\n# Conduta :")
      .replace(/\n{3,}/g, "\n\n");
  }
  return next.trimEnd() + "\n\n" + blockText;
}

function updateHighRiskReavaliacao(option) {
  var editor = document.querySelector("textarea.template-editor");
  var source = editor ? editor.value : state.editableText;
  state.editableText = setHighRiskReavaliacaoBlock(
    source || "",
    option ? highRiskText(option) : ""
  );
  if (editor) editor.value = state.editableText;
  saveReavaliacaoDraft();
}

function insertLabOutputIntoReavaliacao() {
  if (!state.labOutput && state.labInput) transcribeCurrentLabs(null, "auto");
  var output = state.labOutput || "";
  state.labOutput = output;
  if (!output) return;
  var text = state.editableText || "";
  var labsMarker = "# Exames labs:";
  var imageMarker = "# Exames imagem:";
  var labsIndex = text.indexOf(labsMarker);
  var imageIndex = text.indexOf(imageMarker);
  if (labsIndex >= 0 && imageIndex > labsIndex) {
    var beforeLabs = text.slice(0, labsIndex + labsMarker.length).trimEnd();
    var existingLabs = text.slice(labsIndex + labsMarker.length, imageIndex).trim();
    var labsText = existingLabs ? existingLabs + "\n" + output : output;
    state.editableText = beforeLabs + "\n" + labsText + "\n\n" + text.slice(imageIndex).trimStart();
    saveReavaliacaoDraft();
    showToast("Exames inseridos");
    return;
  }
  state.editableText = text.trimEnd() + "\n\nEXAMES:\n" + output;
  saveReavaliacaoDraft();
  showToast("Exames inseridos");
}
