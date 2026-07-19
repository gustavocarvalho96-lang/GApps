function detectAutomaticLabSource(rawText) {
  var text = String(rawText || "");
  var search = jundiaiSearchText(text);
  var sobamScore = 0;
  [
    "laudo liberado eletronicamente",
    "pagina:",
    "nro. da os.",
    "assinatura digital",
    "resultados anteriores:",
    "valor de referencia:",
    "unidade : pronto socorro adulto"
  ].forEach(function (marker) {
    if (search.indexOf(marker) >= 0) sobamScore += 1;
  });
  if (search.indexOf("material:") >= 0 && search.indexOf("liberacao:") >= 0) sobamScore += 1;
  if (sobamScore >= 3) return "sobam";
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
  if (source === "sobam") return "SOBAM";
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

function sobamHeaderSearch(value) {
  return jundiaiSearchText(value).replace(/serica|serico|soro/g, "").replace(/\s+/g, " ").trim();
}

function sobamPatient(rawText) {
  var text = String(rawText || "");
  var match = text.match(/Paciente\s*:\s*:?\s*(.*?)(?:P[áa]gina|PÃ¡gina|Idade\s*:|Data\/Hora|$)/i);
  return match && match[1] ? normalizeText(match[1]) : "NOME DO PACIENTE";
}

function sobamDate(rawText) {
  var text = String(rawText || "");
  var match = text.match(/Coleta\s*:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/Data\/Hora Atend\.\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match && match[1] ? match[1] : "DATA";
}

function sobamSections(rawText) {
  var lines = String(rawText || "").split(/\r?\n/);
  var headers = [
    "UREIA SÉRICA", "UREIA SERICA", "CREATININA SÉRICA", "CREATININA SERICA",
    "ASPARTATO AMINO TRANSFERASE", "ALANINA AMINO TRANSFERASE",
    "BILIRRUBINA TOTAL E FRAÇÕES", "BILIRRUBINA TOTAL E FRACOES",
    "HEMOGRAMA", "URINA TIPO 1", "URINA TIPO I", "SÓDIO", "SODIO",
    "POTÁSSIO", "POTASSIO", "PROTEÍNA C REATIVA", "PROTEINA C REATIVA",
    "AMILASE", "FOSFATASE ALCALINA", "GAMA GLUTAMIL TRANSFERASE"
  ];
  var starts = [];
  for (var i = 0; i < lines.length; i += 1) {
    var line = normalizeText(lines[i]);
    if (!line) continue;
    var search = sobamHeaderSearch(line);
    for (var j = 0; j < headers.length; j += 1) {
      var header = sobamHeaderSearch(headers[j]);
      if (search === header || search.indexOf(header) === 0) {
        starts.push({ index: i, label: headers[j] });
        break;
      }
    }
  }
  var sections = [];
  for (var k = 0; k < starts.length; k += 1) {
    sections.push({
      label: starts[k].label,
      text: lines.slice(starts[k].index, starts[k + 1] ? starts[k + 1].index : lines.length).join("\n")
    });
  }
  return sections;
}

function sobamFindSection(sections, labels) {
  for (var i = 0; i < sections.length; i += 1) {
    var label = sobamHeaderSearch(sections[i].label);
    for (var j = 0; j < labels.length; j += 1) {
      if (label.indexOf(sobamHeaderSearch(labels[j])) >= 0) return sections[i].text;
    }
  }
  return "";
}

function sobamResult(section) {
  var match = String(section || "").match(/Resultado\s*:\s*([<>]?\s*\d{1,3}(?:\.\d{3})*(?:[,.]\d+)?\s*(?:mg\/dL|U\/L|UI\/L|mmol\/L|mEq\/L|ng\/L|pg\/mL)?)/i);
  return match && match[1] ? normalizeText(match[1]) : "";
}

function sobamLineValue(section, label, unitPattern) {
  var escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var unit = unitPattern || "(?:mg\\/dL|g\\/dL|%|fL|pg|\\/mm[³3]|\\/mL|\\/µL|\\/uL|U\\/L|UI\\/L)?";
  var regex = new RegExp(escaped + "[.\\s]*:\\s*([<>]?\\s*\\d{1,3}(?:\\.\\d{3})*(?:[,.]\\d+)?\\s*" + unit + "|Negativo|Positivo|Ausente|Presentes?)", "i");
  var match = String(section || "").match(regex);
  return match && match[1] ? normalizeText(match[1]) : "";
}

function transcribeSobamLabs(rawText) {
  var text = String(rawText || "");
  var sections = sobamSections(text);
  var patient = sobamPatient(text);
  var date = sobamDate(text);
  var items = [];
  function push(item) {
    automaticPush(items, item);
  }

  var hemograma = sobamFindSection(sections, ["HEMOGRAMA"]);
  if (hemograma) {
    var hparts = [];
    var hb = sobamLineValue(hemograma, "Hemoglobina", "g\\/dL");
    var ht = sobamLineValue(hemograma, "Hematócrito", "%") || sobamLineValue(hemograma, "HematÃ³crito", "%");
    var leu = sobamLineValue(hemograma, "Leucócitos", "\\/mm[³3]") || sobamLineValue(hemograma, "LeucÃ³citos", "\\/mm[³3]");
    var plaq = sobamLineValue(hemograma, "Plaquetas", "\\/mm[³3]");
    if (hb) hparts.push("Hb " + hb);
    if (ht) hparts.push("Ht " + ht);
    if (leu) hparts.push("Leuco " + leu);
    if (plaq) hparts.push("Plaq " + plaq);
    if (hparts.length) push("hemograma (" + hparts.join("; ") + ")");
  }

  [
    [["UREIA"], "ureia"],
    [["CREATININA"], "creatinina"],
    [["ASPARTATO AMINO TRANSFERASE"], "TGO"],
    [["ALANINA AMINO TRANSFERASE"], "TGP"],
    [["SÓDIO", "SODIO"], "sodio"],
    [["POTÁSSIO", "POTASSIO"], "potassio"],
    [["PROTEÍNA C REATIVA", "PROTEINA C REATIVA"], "PCR"],
    [["AMILASE"], "amilase"],
    [["FOSFATASE ALCALINA"], "FA"],
    [["GAMA GLUTAMIL TRANSFERASE"], "GGT"]
  ].forEach(function (config) {
    var section = sobamFindSection(sections, config[0]);
    var value = sobamResult(section);
    if (value) push(config[1] + " " + value);
  });

  var bilis = sobamFindSection(sections, ["BILIRRUBINA"]);
  if (bilis) {
    var bt = sobamLineValue(bilis, "BILIRRUBINA TOTAL", "mg\\/dL");
    var bd = sobamLineValue(bilis, "BILIRRUBINA DIRETA", "mg\\/dL");
    var bi = sobamLineValue(bilis, "BILIRRUBINA INDIRETA", "mg\\/dL");
    if (bt || bi || bd) push("BT " + (bt || "") + " (BI = " + (bi || "") + "; BD = " + (bd || "") + ")");
  }

  var urina = sobamFindSection(sections, ["URINA TIPO 1", "URINA TIPO I"]);
  if (urina) {
    var uparts = [];
    var dens = sobamLineValue(urina, "Densidade", "");
    var ph = sobamLineValue(urina, "pH", "");
    var prot = sobamLineValue(urina, "Proteínas", "mg\\/dL") || sobamLineValue(urina, "ProteÃ­nas", "mg\\/dL");
    var nitrito = sobamLineValue(urina, "Nitrito", "");
    var uleu = sobamLineValue(urina, "Leucócitos", "\\/mL") || sobamLineValue(urina, "LeucÃ³citos", "\\/mL");
    var uhem = sobamLineValue(urina, "Eritrócitos", "\\/mL") || sobamLineValue(urina, "EritrÃ³citos", "\\/mL");
    var ubac = sobamLineValue(urina, "Bactérias", "\\/µL|\\/uL") || sobamLineValue(urina, "BactÃ©rias", "\\/µL|\\/uL");
    if (dens) uparts.push("densidade " + dens);
    if (ph) uparts.push("pH " + ph);
    if (prot) uparts.push("proteina " + prot);
    if (nitrito) uparts.push("nitrito " + nitrito);
    if (uleu) uparts.push("leucocitos " + uleu);
    if (uhem) uparts.push("hemacias " + uhem);
    if (ubac) uparts.push("bacterias " + ubac);
    if (uparts.length) push("urina tipo I (" + uparts.join("; ") + ")");
  }

  return patient + " - Laboratorios (" + date + "): " + (items.length ? items.join("; ") : transcribeCampoLimpoLabs(rawText));
}

function transcribeAutomaticLabs(rawText) {
  var source = detectAutomaticLabSource(rawText);
  var output = source === "sobam"
    ? transcribeSobamLabs(rawText)
    : source === "jundiai-pdf"
    ? transcribeJundiaiPdfLabs(rawText)
    : source === "jundiai"
      ? transcribeJundiaiLabs(rawText)
      : transcribeCampoLimpoLabs(rawText);
  return { source: source, label: automaticLabSourceName(source), output: output };
}

window.detectAutomaticLabSource = detectAutomaticLabSource;
window.automaticLabSourceName = automaticLabSourceName;
window.transcribeJundiaiPdfLabs = transcribeJundiaiPdfLabs;
window.transcribeSobamLabs = transcribeSobamLabs;
window.transcribeAutomaticLabs = transcribeAutomaticLabs;
