function detectAutomaticLabSource(rawText) {
  var text = String(rawText || "");
  var search = jundiaiSearchText(text);
  if (
    search.indexOf("pedido :") >= 0 &&
    search.indexOf("pagina:") >= 0 &&
    search.indexOf("hosp. sao vicente de paulo jundiai") >= 0
  ) {
    return "jundiai-pdf";
  }
  var jundiaiScore = 0;
  [
    "o.s.:",
    "coleta:",
    "problema ao visualizar",
    "procedimentosfontes pagadorasunidade de coletaresultados",
    "informacoes da ordem de servico",
    "fonte pagadora:",
    "unidade de coleta:",
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
  if (source === "jundiai-pdf") return "Jundiai PDF";
  return source === "jundiai" ? "Jundiai" : "Campo Limpo";
}

function automaticPush(items, item) {
  item = normalizeText(item);
  if (item && items.indexOf(item) < 0) items.push(item);
}

function automaticSection(text, startLabels, endLabels) {
  var search = jundiaiSearchText(text);
  var startIndex = -1;
  var startLabel = "";
  for (var i = 0; i < startLabels.length; i += 1) {
    var label = jundiaiSearchText(startLabels[i]);
    var found = search.indexOf(label);
    if (found >= 0 && (startIndex < 0 || found < startIndex)) {
      startIndex = found;
      startLabel = label;
    }
  }
  if (startIndex < 0) return "";
  var endIndex = text.length;
  for (var j = 0; j < endLabels.length; j += 1) {
    var endLabel = jundiaiSearchText(endLabels[j]);
    var next = search.indexOf(endLabel, startIndex + startLabel.length);
    if (next >= 0 && next < endIndex) endIndex = next;
  }
  return text.slice(startIndex, endIndex);
}

function automaticMatchValue(source, regex) {
  var match = source.match(regex);
  return match && match[1] ? normalizeText(match[1]) : "";
}

function automaticExamResult(text, labels) {
  var section = automaticSection(text, labels, [
    "Hemograma Completo", "Tempo e atividade Protrombina", "TTPA - Tempo de Tromboplastina Parcial Ativada",
    "Ureia, sérica", "Dosagem sérica de Creatinina", "Sódio", "Potássio", "Magnésio", "Bilirrubinas",
    "TGO/AST", "TGP/ALT", "Gama Glutamil Transferase", "Fosfatase Alcalina", "Amilase", "Urina I",
    "Liberado por", "Pedido :"
  ]);
  if (!section) return "";
  return automaticMatchValue(section, /Resultado\s+([<>]?\s*\d+(?:[.,]\d+)?\s*(?:mg\/dL|mmol\/L|U\/L|UI\/L|ng\/L|mL\/min\/1,73 m2)?)/i);
}

function automaticLineValue(section, label, unitPattern) {
  var escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var regex = new RegExp(escaped + "\\s+((?:[<>]?\\s*\\d+(?:[.,]\\d+)?|Inferior a\\s*\\d+(?:[.,]\\d+)?)\\s*" + unitPattern + ")", "i");
  return automaticMatchValue(section, regex);
}

function transcribeJundiaiPdfLabs(rawText) {
  var text = String(rawText || "");
  var patient = automaticMatchValue(text, /Paciente\s*:\s*(.*?)\s+CNS\s*:/i) || "NOME DO PACIENTE";
  var date = automaticMatchValue(text, /Coleta:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    automaticMatchValue(text, /Data Entrada:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    "DATA";
  var items = [];

  var hemograma = automaticSection(text, ["Hemograma Completo"], ["Tempo e atividade Protrombina", "Ureia, sérica", "Pedido :"]);
  if (hemograma) {
    var hparts = [];
    var hb = automaticLineValue(hemograma, "Hemoglobina", "g\\/dL");
    var ht = automaticLineValue(hemograma, "Hematócrito", "%");
    var leu = automaticLineValue(hemograma, "Leucócitos", "");
    var plaq = automaticLineValue(hemograma, "Plaquetas", "Mil\\/mm3");
    if (hb) hparts.push("Hb " + hb);
    if (ht) hparts.push("Ht " + ht);
    if (leu) hparts.push("Leuco " + jundiaiHemogramLeuco(leu));
    if (plaq) hparts.push("Plaq " + jundiaiHemogramPlaquetas(plaq));
    if (hparts.length) automaticPush(items, "hemograma (" + hparts.join("; ") + ")");
  }

  var tap = automaticSection(text, ["Tempo e atividade Protrombina"], ["Ureia, sérica", "Dosagem sérica de Creatinina", "Pedido :"]);
  if (tap) {
    var coagParts = [];
    var tp = automaticLineValue(tap, "Tempo", "segundos");
    var rni = automaticLineValue(tap, "RNI", "");
    if (tp) coagParts.push("TAP = " + tp);
    if (rni) coagParts.push("RNI = " + rni);
    if (coagParts.length) automaticPush(items, "Coagulograma (" + coagParts.join("; ") + ")");
  }

  [
    [["Ureia, sérica"], "ureia"],
    [["Sódio"], "sodio"],
    [["Potássio"], "potassio"],
    [["Magnésio"], "magnesio"],
    [["TGO/AST"], "TGO"],
    [["TGP/ALT"], "TGP"],
    [["Gama Glutamil Transferase", "Gama Glutamil Transferase - GGT"], "GGT"],
    [["Fosfatase Alcalina"], "FA"],
    [["Amilase"], "amilase"]
  ].forEach(function (config) {
    var value = automaticExamResult(text, config[0]);
    if (value) automaticPush(items, config[1] + " " + value);
  });

  var creatinina = automaticSection(text, ["Dosagem sérica de Creatinina"], ["Sódio", "Potássio", "Bilirrubinas", "Pedido :"]);
  var creatininaValue = automaticLineValue(creatinina, "Creatinina", "mg\\/dL");
  if (creatininaValue) automaticPush(items, "creatinina " + creatininaValue);

  var bilis = automaticSection(text, ["Bilirrubinas"], ["TGO/AST", "TGP/ALT", "Pedido :"]);
  if (bilis) {
    var bt = automaticLineValue(bilis, "Bilirrubina Total", "mg\\/dL");
    var bd = automaticLineValue(bilis, "Bilirrubina Direta", "mg\\/dL");
    var bi = automaticLineValue(bilis, "Bilirrubina Indireta", "mg\\/dL");
    if (bt || bi || bd) automaticPush(items, "BT " + (bt || "") + " (BI = " + (bi || "") + "; BD = " + (bd || "") + ")");
  }

  var urina = automaticSection(text, ["Urina I"], ["Pedido :", "ASSINATURA DIGITAL"]);
  if (urina) {
    var uparts = [];
    var prot = automaticMatchValue(urina, /Proteína\s+((?:\+\s*){1,4}|Negativo|Traços?)/i);
    var uleu = automaticLineValue(urina, "Leucócitos", "\\/mL");
    var uhem = automaticLineValue(urina, "Hemácias", "\\/mL");
    var ubac = automaticLineValue(urina, "Bactérias", "\\/mL");
    if (prot) uparts.push("proteina " + prot);
    if (uleu) uparts.push("leucocitos " + uleu);
    if (uhem) uparts.push("hemacias " + uhem);
    if (ubac) uparts.push("bacterias " + ubac);
    if (uparts.length) automaticPush(items, "urina tipo I (" + uparts.join("; ") + ")");
  }

  return patient + " - Laboratorios (" + date + "): " + (items.length ? items.join("; ") : transcribeJundiaiLabs(rawText));
}

function transcribeAutomaticLabs(rawText) {
  var source = detectAutomaticLabSource(rawText);
  var output = source === "jundiai-pdf"
    ? transcribeJundiaiPdfLabs(rawText)
    : source === "jundiai"
      ? transcribeJundiaiLabs(rawText)
      : transcribeCampoLimpoLabs(rawText);
  return { source: source, label: automaticLabSourceName(source), output: output };
}

window.detectAutomaticLabSource = detectAutomaticLabSource;
window.automaticLabSourceName = automaticLabSourceName;
window.transcribeJundiaiPdfLabs = transcribeJundiaiPdfLabs;
window.transcribeAutomaticLabs = transcribeAutomaticLabs;
