function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function valueAfter(source, label, tokenCount, useLast) {
  var sourceLower = source.toLowerCase();
  var search = label.toLowerCase();
  var index = useLast ? sourceLower.lastIndexOf(search) : sourceLower.indexOf(search);
  if (index < 0) return "";
  return normalizeText(source.slice(index + label.length)).split(" ").slice(0, tokenCount).join(" ");
}

function transcribeLabs(rawText) {
  var text = normalizeText(String(rawText || "").replace(/[\r\n_]/g, " "));
  var lower = text.toLowerCase();
  var patient = "NOME DO PACIENTE";
  var date = "DATA";
  var patientMatch = text.match(/Paciente\s*:\s*(.*?)(Data de Nascimento|Cadastro|Convenio|Convênio|$)/i);
  if (patientMatch && patientMatch[1]) patient = patientMatch[1].trim();
  patient = patient.replace(/\s*Protocolo\s*:?\s*\d+\s*$/i, "").trim();
  var cadastroIndex = lower.indexOf("cadastro");
  var dateMatch = cadastroIndex >= 0
    ? text.slice(cadastroIndex, cadastroIndex + 100).match(/\b\d{2}\/\d{2}\/\d{4}\b/)
    : text.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
  if (dateMatch) date = dateMatch[0];

  var items = [];
  function push(item) {
    item = normalizeText(item);
    if (item && items.indexOf(item) < 0) items.push(item);
  }
  function sliceBetween(start, ends) {
    var startIndex = lower.indexOf(start.toLowerCase());
    if (startIndex < 0) return "";
    var endIndex = text.length;
    ends.forEach(function (end) {
      var found = lower.indexOf(end.toLowerCase(), startIndex + start.length);
      if (found >= 0 && found < endIndex) endIndex = found;
    });
    return text.slice(startIndex, endIndex);
  }

  var hemograma = sliceBetween("HEMOGRAMA COMPLETO", ["PROTEINA C REATIVA", "PROTEÍNA C REATIVA", "URINA TIPO I", "COAGULOGRAMA"]);
  if (hemograma) {
    var parts = [];
    var hb = valueAfter(hemograma, "Hemoglobina", 2);
    var ht = valueAfter(hemograma, "Hematocrito", 2) || valueAfter(hemograma, "Hematócrito", 2);
    var leu = valueAfter(hemograma, "Leucocitos", 2) || valueAfter(hemograma, "Leucócitos", 2);
    var plaq = valueAfter(hemograma, "Plaquetas", 2, true);
    if (hb) parts.push("Hb " + hb);
    if (ht) parts.push("Ht " + ht);
    if (leu) parts.push("Leuco " + leu);
    if (plaq) parts.push("Plaq " + plaq);
    if (parts.length) push("hemograma (" + parts.join("; ") + ")");
  }

  [
    ["CREATININA", "creatinina"],
    ["UREIA", "ureia"],
    ["SODIO", "sodio"],
    ["SÓDIO", "sodio"],
    ["POTASSIO", "potassio"],
    ["POTÁSSIO", "potassio"],
    ["PROTEINA C REATIVA", "PCR"],
    ["PROTEÍNA C REATIVA", "PCR"],
    ["CALCIO", "calcio"],
    ["CÁLCIO", "calcio"],
    ["MAGNESIO", "magnesio"],
    ["MAGNÉSIO", "magnesio"],
    ["CK-MB", "CK-MB"],
    ["CK MB", "CK-MB"],
    ["CKMB", "CK-MB"],
    ["CREATINOQUINASE MB", "CK-MB"],
    ["CREATINA QUINASE MB", "CK-MB"],
    ["CPK", "CPK"],
    ["CREATINOFOSFOQUINASE", "CPK"],
    ["CREATINA FOSFOQUINASE", "CPK"],
    ["CREATINOQUINASE TOTAL", "CPK"],
    ["TROPONINA", "troponina"],
    ["AMILASE SERICA", "amilase"],
    ["AMILASE SÉRICA", "amilase"],
    ["AMILASE", "amilase"],
    ["FOSFATASE ALCALINA", "FA"],
    ["GAMA GLUTAMIL TRANSFERASE", "GGT"],
  ].forEach(function (exam) {
    var start = lower.indexOf(exam[0].toLowerCase());
    if (start < 0) return;
    var resultIndex = lower.indexOf("resultado", start);
    if (resultIndex < 0) return;
    var afterResult = text.slice(resultIndex).replace(/^resultado\s*:?\s*/i, "");
    var result = normalizeText(afterResult).split(" ").slice(0, 2).join(" ");
    if (result) push(exam[1] + " " + result);
  });

  function examResult(labels) {
    for (var i = 0; i < labels.length; i += 1) {
      var start = lower.indexOf(labels[i].toLowerCase());
      if (start < 0) continue;
      var nextExam = text.length;
      ["BILIRRUBINA TOTAL", "BILIRRUBINAS TOTAL", "BILIRRUBINA DIRETA", "BILIRRUBINA INDIRETA", "BILLIRUBINA TOTAL", "BILLIRUBINA DIRETA", "BILLIRUBINA INDIRETA", "FOSFATASE ALCALINA", "GAMA GLUTAMIL TRANSFERASE", "AMILASE", "URINA TIPO I", "HEMOGRAMA COMPLETO"].forEach(function (marker) {
        var found = lower.indexOf(marker.toLowerCase(), start + labels[i].length);
        if (found >= 0 && found < nextExam) nextExam = found;
      });
      var block = text.slice(start, nextExam);
      var resultIndex = block.toLowerCase().indexOf("resultado");
      var candidate = resultIndex >= 0
        ? block.slice(resultIndex).replace(/^resultado\s*:?\s*/i, "")
        : block.slice(labels[i].length);
      var match = normalizeText(candidate).match(/([<>]?\s*\d+(?:[.,]\d+)?\s*[a-zA-Z/%µ]+(?:\/[a-zA-Z]+)?)/);
      if (match && match[1]) return normalizeText(match[1]);
    }
    return "";
  }

  var bt = examResult(["BILIRRUBINA TOTAL", "BILIRRUBINAS TOTAL", "BILLIRUBINA TOTAL", "BILLIRUBINAS TOTAL"]);
  var bd = examResult(["BILIRRUBINA DIRETA", "BILLIRUBINA DIRETA"]);
  var bi = examResult(["BILIRRUBINA INDIRETA", "BILLIRUBINA INDIRETA"]);
  if (bt || bi || bd) {
    push("BT " + (bt || "") + " (BI = " + (bi || "") + "; BD = " + (bd || "") + ")");
  }

  function pushTransaminase(labels, shortName) {
    for (var i = 0; i < labels.length; i += 1) {
      var label = labels[i];
      var start = lower.indexOf(label.toLowerCase());
      if (start < 0) continue;
      var resultIndex = lower.indexOf("resultado:", start);
      if (resultIndex < 0) continue;
      var result = normalizeText(text.slice(resultIndex + "resultado:".length)).split(" ").slice(0, 2).join(" ");
      if (result) {
        push(shortName + " " + result);
        return;
      }
    }
  }

  pushTransaminase(["TRANSAMINASE GLUTAMICA OXALACETICA - TGO", "TRANSAMINASE GLUTAMICA OXALACETICA", "ASPARTATO AMINOTRANSFERASE"], "TGO");
  pushTransaminase(["TRANSAMINASE GLUTAMICA PIRUVICA - TGP/ALT", "TRANSAMINASE GLUTAMICA PIRUVICA", "ALANINA AMINOTRANSFERASE"], "TGP");

  function coagValue(source, labels, tokenCount) {
    for (var i = 0; i < labels.length; i += 1) {
      var value = valueAfter(source, labels[i], tokenCount);
      if (value) return value;
    }
    return "";
  }

  function sectionFromLabels(labels) {
    var startIndex = -1;
    for (var i = 0; i < labels.length; i += 1) {
      var found = lower.indexOf(labels[i].toLowerCase());
      if (found >= 0 && (startIndex < 0 || found < startIndex)) startIndex = found;
    }
    if (startIndex < 0) return "";
    var endIndex = text.length;
    [
      "CREATINA QUINASE", "CREATININA", "FOSFATASE ALCALINA", "GAMA GLUTAMIL TRANSFERASE",
      "PROTEINA C REATIVA", "PROTEÍNA C REATIVA", "POTASSIO", "POTÁSSIO", "SODIO", "SÓDIO",
      "TRANSAMINASE", "UREIA", "HEMOGRAMA COMPLETO", "URINA TIPO I", "TEMPO DE ATIVAÇÃO",
      "TEMPO DE ATIVACAO", "TEMPO DE TROMBOPLASTINA", "COAGULOGRAMA"
    ].forEach(function (marker) {
      var found = lower.indexOf(marker.toLowerCase(), startIndex + 1);
      if (found >= 0 && found < endIndex) endIndex = found;
    });
    return text.slice(startIndex, endIndex);
  }

  function resultValue(source, tokenCount) {
    var result = valueAfter(source, "Resultado:", tokenCount) || valueAfter(source, "Resultado", tokenCount);
    return result;
  }

  var coag = sliceBetween("COAGULOGRAMA", ["CREATININA", "UREIA", "GAMA GLUTAMIL TRANSFERASE", "HEMOGRAMA COMPLETO", "URINA TIPO I", "GASOMETRIA"]);
  var tap = sectionFromLabels(["TEMPO DE ATIVAÇÃO DA PROTROMBINA", "TEMPO DE ATIVACAO DA PROTROMBINA", "TAP"]);
  var ttpaBlock = sectionFromLabels(["TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA", "TTPA"]);
  if (coag || tap || ttpaBlock) {
    var tp = coagValue(coag || tap, ["Tempo de Protrombina:", "Tempo de Protrombina", "Tempo do Protrombina:", "Tempo do Protrombina", "TP:"], 2) || resultValue(tap, 2);
    var inr = coagValue(coag || tap, ["INR:", "INR", "RNI:", "RNI"], 1);
    var ttpa = coagValue(coag, ["TTPA:", "TTPA", "Tempo de Tromboplastina Parcial Ativada"], 2) || resultValue(ttpaBlock, 2);
    var coagParts = [];
    if (tp) coagParts.push("TAP = " + tp);
    if (inr) coagParts.push("RNI = " + inr);
    if (ttpa) coagParts.push("TTPA = " + ttpa);
    if (coagParts.length) push("Coagulograma (" + coagParts.join("; ") + ")");
  }

  function findUrinaSection() {
    var starts = ["URINA TIPO I", "URINA TIPO 1", "EAS", "URINA I"];
    for (var i = 0; i < starts.length; i += 1) {
      var startIndex = lower.indexOf(starts[i].toLowerCase());
      if (startIndex >= 0) return text.slice(startIndex);
    }
    return "";
  }

  function urineValue(source, labels, tokenCount) {
    for (var i = 0; i < labels.length; i += 1) {
      var value = valueAfter(source, labels[i], tokenCount);
      if (value) return value;
    }
    return "";
  }

  function urineRegexValue(source, regex) {
    var match = source.match(regex);
    return match && match[1] ? normalizeText(match[1]) : "";
  }

  var urina = findUrinaSection();
  if (urina) {
    var uparts = [];
    var uleu = urineRegexValue(urina, /leuc\S*citos\s*[:\-]?\s*([><]?\s*[\d.,]+(?:\s*\/?\s*[a-zA-Z]+)?)/i) || urineValue(urina, ["Leucocitos"], 2);
    var uhem = urineRegexValue(urina, /hem\S*cias\s*[:\-]?\s*([><]?\s*[\d.,]+(?:\s*\/?\s*[a-zA-Z]+)?)/i) || urineValue(urina, ["Hemacias"], 2);
    var ubac = urineRegexValue(urina, /(?:flora bacteriana|bact\S*rias)\s*[:\-]?\s*(\+{1,4}|ausente|ausentes|rara|raras|presente|presentes)/i) || urineValue(urina, ["Bacterias", "Flora bacteriana"], 1);
    if (uleu) uparts.push("leucocitos " + uleu);
    if (uhem) uparts.push("hemacias " + uhem);
    if (ubac) uparts.push("flora bacteriana " + ubac);
    if (uparts.length) push("urina tipo I (" + uparts.join("; ") + ")");
  }

  return patient + " - Laboratorios (" + date + "): " + (items.length ? items.join("; ") : text);
}

function transcribeCampoLimpoLabs(rawText) {
  return transcribeLabs(rawText);
}

function jundiaiSearchText(value) {
  return normalizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function jundiaiLines(rawText) {
  return String(rawText || "").split(/\r?\n/).map(normalizeText).filter(Boolean);
}

function jundiaiSection(lines, startLabels, endLabels) {
  var startIndex = -1;
  for (var i = 0; i < lines.length; i += 1) {
    var line = jundiaiSearchText(lines[i]);
    for (var j = 0; j < startLabels.length; j += 1) {
      if (line === jundiaiSearchText(startLabels[j]) || line.indexOf(jundiaiSearchText(startLabels[j])) >= 0) {
        startIndex = i;
        break;
      }
    }
    if (startIndex >= 0) break;
  }
  if (startIndex < 0) return [];
  var endIndex = lines.length;
  for (var k = startIndex + 1; k < lines.length; k += 1) {
    var next = jundiaiSearchText(lines[k]);
    for (var m = 0; m < endLabels.length; m += 1) {
      if (next === jundiaiSearchText(endLabels[m]) || next.indexOf(jundiaiSearchText(endLabels[m])) >= 0) {
        endIndex = k;
        return lines.slice(startIndex, endIndex);
      }
    }
  }
  return lines.slice(startIndex);
}

function jundiaiLooksLikeValue(value) {
  return /^\s*(?:[<>]?\s*\d{1,3}(?:\.\d{3})*(?:[,.]\d+)?|\+\s*\+|\+{1,4}|negativo|normal|raras?|ausentes?|inferior a\s*\d+(?:[,.]\d+)?)\s*$/i.test(value);
}

function jundiaiValueAfter(lines, labels) {
  for (var i = 0; i < lines.length; i += 1) {
    var line = jundiaiSearchText(lines[i]);
    for (var j = 0; j < labels.length; j += 1) {
      var label = jundiaiSearchText(labels[j]);
      if (line === label || line.indexOf(label) >= 0) {
        for (var k = i + 1; k < Math.min(lines.length, i + 10); k += 1) {
          if (jundiaiLooksLikeValue(lines[k])) return lines[k];
        }
      }
    }
  }
  return "";
}

function jundiaiLooksLikeUnit(value) {
  return /^(?:g\/dL|mg\/dL|mmol\/L|ng\/L|pg\/mL|mL\/min\/1,73 m2|Mil\/mm3|10\^6\/mm3|\/mL|%|segundos?)$/i.test(normalizeText(value));
}

function jundiaiValueWithUnitAfter(lines, labels) {
  for (var i = 0; i < lines.length; i += 1) {
    var line = jundiaiSearchText(lines[i]);
    for (var j = 0; j < labels.length; j += 1) {
      var label = jundiaiSearchText(labels[j]);
      if (line === label || line.indexOf(label) >= 0) {
        for (var k = i + 1; k < Math.min(lines.length, i + 10); k += 1) {
          if (jundiaiLooksLikeValue(lines[k])) {
            var value = lines[k];
            var unit = jundiaiLooksLikeUnit(lines[k + 1] || "") ? normalizeText(lines[k + 1]) : "";
            return unit ? value + " " + unit : value;
          }
        }
      }
    }
  }
  return "";
}

function jundiaiHemogramLeuco(value) {
  var number = normalizeText(value).match(/\d+(?:[,.]\d+)?/);
  if (!number) return value;
  return String(Math.round(parseFloat(number[0].replace(".", "").replace(",", ".")) * 1000));
}

function jundiaiHemogramPlaquetas(value) {
  var number = normalizeText(value).match(/\d+(?:[,.]\d+)?/);
  return number ? number[0] + " mil" : value;
}

function jundiaiPatient(lines) {
  for (var i = 0; i < lines.length; i += 1) {
    if (jundiaiSearchText(lines[i]) === "paciente:") {
      for (var j = i + 1; j < Math.min(lines.length, i + 6); j += 1) {
        if (!/^(codigo:|dt\.?nascimento:|sexo:|rg:|cpf:)$/i.test(jundiaiSearchText(lines[j]))) return lines[j];
      }
    }
  }
  return "NOME DO PACIENTE";
}

function jundiaiDate(lines) {
  for (var i = 0; i < lines.length; i += 1) {
    if (jundiaiSearchText(lines[i]) === "coleta:") {
      var match = (lines[i + 1] || "").match(/\b\d{2}\/\d{2}\/\d{4}\b/);
      if (match) return match[0];
    }
  }
  var osText = lines.join(" ");
  var osMatch = osText.match(/O\.S\.:.*?\b(\d{2}\/\d{2}\/\d{4})\b/i);
  return osMatch ? osMatch[1] : "DATA";
}

function transcribeJundiaiLabs(rawText) {
  var lines = jundiaiLines(rawText);
  var patient = jundiaiPatient(lines);
  var date = jundiaiDate(lines);
  var examHeaders = [
    "Hemograma Completo", "Tempo e atividade Protrombina", "TTPA - Tempo de Tromboplastina Parcial Ativada",
    "Ureia, sérica", "Dosagem sérica de Creatinina", "Sódio", "Potássio", "Magnésio", "Bilirrubinas",
    "Proteína C Reativa - PCR", "Troponina", "Troponina I", "Troponina T", "Urina I", "Cálcio Ionizado",
    "Dosagem de Lactato", "Problema ao visualizar"
  ];
  var items = [];
  function push(item) {
    item = normalizeText(item);
    if (item && items.indexOf(item) < 0) items.push(item);
  }

  var hemograma = jundiaiSection(lines, ["Hemograma Completo"], examHeaders.slice(1));
  if (hemograma.length) {
    var hparts = [];
    var hb = jundiaiValueWithUnitAfter(hemograma, ["Hemoglobina"]);
    var ht = jundiaiValueWithUnitAfter(hemograma, ["Hematócrito"]);
    var leu = jundiaiValueAfter(hemograma, ["Leucócitos"]);
    var plaq = jundiaiValueAfter(hemograma, ["Plaquetas"]);
    if (hb) hparts.push("Hb " + hb);
    if (ht) hparts.push("Ht " + ht);
    if (leu) hparts.push("Leuco " + jundiaiHemogramLeuco(leu));
    if (plaq) hparts.push("Plaq " + jundiaiHemogramPlaquetas(plaq));
    if (hparts.length) push("hemograma (" + hparts.join("; ") + ")");
  }

  var tap = jundiaiSection(lines, ["Tempo e atividade Protrombina"], examHeaders.slice(2));
  var ttpa = jundiaiSection(lines, ["TTPA - Tempo de Tromboplastina Parcial Ativada"], examHeaders.slice(3));
  var coagParts = [];
  var tp = jundiaiValueWithUnitAfter(tap, ["Tempo"]);
  var rni = jundiaiValueAfter(tap, ["RNI"]);
  var ttpaTempo = jundiaiValueWithUnitAfter(ttpa, ["Tempo"]);
  if (tp) coagParts.push("TAP = " + tp);
  if (rni) coagParts.push("RNI = " + rni);
  if (ttpaTempo) coagParts.push("TTPA = " + ttpaTempo);
  if (coagParts.length) push("Coagulograma (" + coagParts.join("; ") + ")");

  [
    [["Ureia, sérica"], "ureia", ["Resultado"]],
    [["Dosagem sérica de Creatinina"], "creatinina", ["Creatinina"]],
    [["Sódio"], "sodio", ["Resultado"]],
    [["Potássio"], "potassio", ["Resultado"]],
    [["Magnésio"], "magnesio", ["Resultado"]],
    [["Proteína C Reativa - PCR"], "PCR", ["Resultado"]],
    [["Troponina", "Troponina I", "Troponina T"], "troponina", ["Resultado"]]
  ].forEach(function (config) {
    var section = jundiaiSection(lines, config[0], examHeaders);
    var value = jundiaiValueWithUnitAfter(section, config[2]);
    if (value) push(config[1] + " " + value);
  });

  var bilis = jundiaiSection(lines, ["Bilirrubinas"], examHeaders);
  var bt = jundiaiValueWithUnitAfter(bilis, ["Bilirrubina Total"]);
  var bd = jundiaiValueWithUnitAfter(bilis, ["Bilirrubina Direta"]);
  var bi = jundiaiValueWithUnitAfter(bilis, ["Bilirrubina Indireta"]);
  if (bt || bi || bd) push("BT " + (bt || "") + " (BI = " + (bi || "") + "; BD = " + (bd || "") + ")");

  var urina = jundiaiSection(lines, ["Urina I"], examHeaders);
  if (urina.length) {
    var uparts = [];
    var prot = jundiaiValueAfter(urina, ["Proteína"]);
    var uleu = jundiaiValueWithUnitAfter(urina, ["Leucócitos"]);
    var uhem = jundiaiValueWithUnitAfter(urina, ["Hemácias"]);
    var ubac = jundiaiValueWithUnitAfter(urina, ["Bactérias"]);
    if (prot) uparts.push("proteina " + prot);
    if (uleu) uparts.push("leucocitos " + uleu);
    if (uhem) uparts.push("hemacias " + uhem);
    if (ubac) uparts.push("bacterias " + ubac);
    if (uparts.length) push("urina tipo I (" + uparts.join("; ") + ")");
  }

  [
    [["Cálcio Ionizado"], "calcio ionizado", ["Resultado"]],
    [["Dosagem de Lactato"], "lactato", ["Resultado"]]
  ].forEach(function (config) {
    var section = jundiaiSection(lines, config[0], examHeaders);
    var value = jundiaiValueWithUnitAfter(section, config[2]);
    if (value) push(config[1] + " " + value);
  });

  return patient + " - Laboratorios (" + date + "): " + (items.length ? items.join("; ") : transcribeLabs(rawText));
}

window.normalizeText = normalizeText;
window.transcribeLabs = transcribeLabs;
window.transcribeCampoLimpoLabs = transcribeCampoLimpoLabs;
window.transcribeJundiaiLabs = transcribeJundiaiLabs;
