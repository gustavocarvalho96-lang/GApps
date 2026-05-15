function scoreConfigsNeuro() {
  var configs = [];
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
  
  return configs;
}
