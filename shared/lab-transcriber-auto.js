function detectAutomaticLabSource(rawText) {
  var text = String(rawText || "");
  var search = jundiaiSearchText(text);
  var jundiaiScore = 0;
  [
    "o.s.:",
    "coleta:",
    "problema ao visualizar",
    "dosagem serica de creatinina",
    "tempo e atividade protrombina",
    "ttpa - tempo de tromboplastina parcial ativada",
    "calcio ionizado"
  ].forEach(function (marker) {
    if (search.indexOf(marker) >= 0) jundiaiScore += 1;
  });
  if (/paciente:\s*\n/i.test(text)) jundiaiScore += 1;
  return jundiaiScore >= 2 ? "jundiai" : "campo-limpo";
}

function automaticLabSourceName(source) {
  return source === "jundiai" ? "Jundiai" : "Campo Limpo";
}

function transcribeAutomaticLabs(rawText) {
  var source = detectAutomaticLabSource(rawText);
  var output = source === "jundiai" ? transcribeJundiaiLabs(rawText) : transcribeCampoLimpoLabs(rawText);
  return { source: source, label: automaticLabSourceName(source), output: output };
}

window.detectAutomaticLabSource = detectAutomaticLabSource;
window.automaticLabSourceName = automaticLabSourceName;
window.transcribeAutomaticLabs = transcribeAutomaticLabs;
