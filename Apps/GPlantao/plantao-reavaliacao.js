function transcribeCurrentLabs(input, source) {
  state.labInput = input ? input.value : state.labInput;
  state.labSource = source || "auto";
  if (state.labSource === "auto") {
    var result = transcribeAutomaticLabs(state.labInput);
    state.labDetectedSource = result.label;
    state.labOutput = result.output;
    return;
  }
  state.labDetectedSource = state.labSource === "jundiai" ? "Jundiai" : "Campo Limpo";
  state.labOutput = state.labSource === "jundiai" ? transcribeJundiaiLabs(state.labInput) : transcribeCampoLimpoLabs(state.labInput);
}

function labSourceLabel() {
  if (state.labSource === "auto") return "Auto: " + (state.labDetectedSource || "aguardando detecção");
  return state.labSource === "jundiai" ? "Jundiai" : "Campo Limpo";
}

function insertLabOutputIntoReavaliacao() {
  if (!state.labOutput && state.labInput) transcribeCurrentLabs(null, "auto");
  var output = state.labOutput || "";
  state.labOutput = output;
  if (!output) return;
  var text = state.editableText || "";
  var labsMarker = "-->Exames labs:";
  var imageMarker = "-->Exames imagem:";
  var labsIndex = text.indexOf(labsMarker);
  var imageIndex = text.indexOf(imageMarker);
  if (labsIndex >= 0 && imageIndex > labsIndex) {
    var beforeLabs = text.slice(0, labsIndex + labsMarker.length).trimEnd();
    var existingLabs = text.slice(labsIndex + labsMarker.length, imageIndex).trim();
    var labsText = existingLabs ? existingLabs + "\n" + output : output;
    state.editableText =
      beforeLabs +
      "\n" + labsText + "\n\n" +
      text.slice(imageIndex).trimStart();
    showToast("Exames inseridos");
    return;
  }
  state.editableText = text.trimEnd() + "\n\nEXAMES:\n" + output;
  showToast("Exames inseridos");
}
