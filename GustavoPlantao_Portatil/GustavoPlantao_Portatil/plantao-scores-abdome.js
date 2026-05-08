function scoreConfigsAbdome() {
  var configs = [];
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
    configs.push({
      id: "bisap",
      short: "BISAP",
      title: "BISAP - Pancreatite aguda",
      fields: [
        { type: "yesno", key: "bun", label: "Ureia/BUN >25 mg/dL" },
        { type: "yesno", key: "mental", label: "Alteracao mental" },
        { type: "yesno", key: "sirs", label: "SIRS presente" },
        { type: "yesno", key: "age", label: "Idade >60" },
        { type: "yesno", key: "pleural", label: "Derrame pleural" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["bun", "mental", "sirs", "age", "pleural"]);
        var risk = total <= 1 ? "baixo" : total === 2 ? "moderado" : "alto";
        return { summary: total + "/5 - risco " + risk, text: "- BISAP: " + total + "/5 (risco " + risk + " em pancreatite aguda)." };
      }
    });
    configs.push({
      id: "ransonAdm",
      short: "Ranson adm.",
      title: "Ranson admissao - Pancreatite",
      fields: [
        { type: "yesno", key: "age", label: "Idade >55 anos" },
        { type: "yesno", key: "wbc", label: "Leuco >16000" },
        { type: "yesno", key: "glucose", label: "Glicose >200 mg/dL" },
        { type: "yesno", key: "ast", label: "TGO/AST >250" },
        { type: "yesno", key: "ldh", label: "LDH >350" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["age", "wbc", "glucose", "ast", "ldh"]);
        var risk = total <= 2 ? "baixo/moderado" : "alto";
        return { summary: total + "/5 admissao - risco " + risk, text: "- Ranson na admissao: " + total + "/5 (risco " + risk + "; completar criterios em 48h se internado)." };
      }
    });
    configs.push({
      id: "tokyoChole",
      short: "Tokyo colecistite",
      title: "Tokyo - Colecistite aguda",
      fields: [
        { type: "yesno", key: "organ", label: "Disfuncao organica" },
        { type: "yesno", key: "wbc", label: "Leuco >18000" },
        { type: "yesno", key: "mass", label: "Massa dolorosa palpavel" },
        { type: "yesno", key: "duration", label: "Sintomas >72h" },
        { type: "yesno", key: "local", label: "Inflamacao local importante" }
      ],
      result: function (s) {
        var moderate = scoreSum(s, ["wbc", "mass", "duration", "local"]);
        var grade = Number(s.organ || 0) ? "grau III - grave" : moderate ? "grau II - moderada" : "grau I - leve";
        return { summary: grade, text: "- Tokyo colecistite: " + grade + "." };
      }
    });
    configs.push({
      id: "tokyoCholangitis",
      short: "Tokyo colangite",
      title: "Tokyo - Colangite aguda",
      fields: [
        { type: "yesno", key: "organ", label: "Disfuncao organica" },
        { type: "yesno", key: "wbc", label: "Leuco >12000 ou <4000" },
        { type: "yesno", key: "fever", label: "Febre >=39" },
        { type: "yesno", key: "age", label: "Idade >=75" },
        { type: "yesno", key: "bili", label: "Bilirrubina >=5 mg/dL" },
        { type: "yesno", key: "albumin", label: "Albumina baixa" }
      ],
      result: function (s) {
        var moderate = scoreSum(s, ["wbc", "fever", "age", "bili", "albumin"]);
        var grade = Number(s.organ || 0) ? "grau III - grave" : moderate ? "grau II - moderada" : "grau I - leve";
        return { summary: grade, text: "- Tokyo colangite: " + grade + "." };
      }
    });
    configs.push({
      id: "gbs",
      short: "Glasgow-Blatchford",
      title: "Glasgow-Blatchford - HDA",
      fields: [
        { type: "option", key: "bun", label: "Ureia/BUN", options: [["0", "normal"], ["2", "18,2-22,4"], ["3", "22,4-28"], ["4", "28-70"], ["6", ">70"]] },
        { type: "option", key: "hb", label: "Hemoglobina", options: [["0", "normal"], ["1", "queda leve"], ["3", "queda moderada"], ["6", "queda importante"]] },
        { type: "option", key: "sbp", label: "PAS", options: [["0", ">=110"], ["1", "100-109"], ["2", "90-99"], ["3", "<90"]] },
        { type: "yesno", key: "pulse", label: "Pulso >=100" },
        { type: "yesno", key: "melena", label: "Melena" },
        { type: "yesno", key: "syncope", label: "Sincope", points: 2 },
        { type: "yesno", key: "hepatic", label: "Doenca hepatica", points: 2 },
        { type: "yesno", key: "heart", label: "Insuf. cardiaca", points: 2 }
      ],
      result: function (s) {
        var total = scoreSum(s, ["bun", "hb", "sbp", "pulse", "melena", "syncope", "hepatic", "heart"]);
        var risk = total <= 1 ? "muito baixo" : total <= 5 ? "intermediario" : "alto";
        return { summary: total + " pts - risco " + risk, text: "- Glasgow-Blatchford: " + total + " pts (risco " + risk + " em hemorragia digestiva alta)." };
      }
    });
  
  return configs;
}
