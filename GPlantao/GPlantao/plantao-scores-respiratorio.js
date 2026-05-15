function scoreConfigsRespiratorio() {
  var configs = [];
    configs.push({
      id: "news2",
      short: "NEWS2",
      title: "NEWS2",
      fields: [
        { type: "option", key: "rr", label: "FR", options: [["3", "<=8"], ["1", "9-11"], ["0", "12-20"], ["2", "21-24"], ["3", ">=25"]] },
        { type: "option", key: "spo2", label: "Sat O2 escala 1", options: [["3", "<=91%"], ["2", "92-93%"], ["1", "94-95%"], ["0", ">=96%"]] },
        { type: "yesno", key: "oxygen", label: "Uso de O2", points: 2 },
        { type: "option", key: "sbp", label: "PAS", options: [["3", "<=90"], ["2", "91-100"], ["1", "101-110"], ["0", "111-219"], ["3", ">=220"]] },
        { type: "option", key: "pulse", label: "Pulso", options: [["3", "<=40"], ["1", "41-50"], ["0", "51-90"], ["1", "91-110"], ["2", "111-130"], ["3", ">=131"]] },
        { type: "option", key: "mental", label: "Consciência", options: [["0", "Alerta"], ["3", "Confusão/V/P/U"]] },
        { type: "option", key: "temp", label: "Temperatura", options: [["3", "<=35,0"], ["1", "35,1-36,0"], ["0", "36,1-38,0"], ["1", "38,1-39,0"], ["2", ">=39,1"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["rr", "spo2", "oxygen", "sbp", "pulse", "mental", "temp"]);
        var anyThree = ["rr", "spo2", "sbp", "pulse", "mental", "temp"].some(function (key) { return Number(s[key] || 0) === 3; });
        var risk = total >= 7 ? "alto" : total >= 5 || anyThree ? "medio" : total >= 1 ? "baixo" : "baixo/normal";
        return { summary: total + " pts - risco " + risk, text: "- NEWS2: " + total + " pts (risco " + risk + (anyThree ? "; parametro isolado = 3" : "") + ")." };
      }
    });
    configs.push({
      id: "qsofa",
      short: "qSOFA",
      title: "qSOFA",
      fields: [
        { type: "yesno", key: "fr", label: "FR >= 22" },
        { type: "yesno", key: "pas", label: "PAS <= 100" },
        { type: "yesno", key: "mental", label: "Alteracao mental / GCS < 15" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["fr", "pas", "mental"]);
        var risk = total >= 2 ? "risco aumentado" : "baixo risco pelo escore";
        return { summary: total + "/3 - " + risk, text: "- qSOFA: " + total + "/3 (" + risk + ")." };
      }
    });
    configs.push({
      id: "sirs",
      short: "SIRS",
      title: "SIRS",
      fields: [
        { type: "yesno", key: "temp", label: "Temp >38 ou <36" },
        { type: "yesno", key: "fc", label: "FC > 90" },
        { type: "yesno", key: "fr", label: "FR > 20" },
        { type: "yesno", key: "leuco", label: "Leuco >12000/<4000 ou desvio" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["temp", "fc", "fr", "leuco"]);
        var risk = total >= 2 ? "SIRS positivo" : "SIRS negativo";
        return { summary: total + "/4 - " + risk, text: "- SIRS: " + total + "/4 (" + risk + ")." };
      }
    });
    configs.push({
      id: "curb65",
      short: "CURB-65",
      title: "CURB-65 / CRB-65",
      fields: [
        { type: "yesno", key: "confusion", label: "Confusao" },
        { type: "yesno", key: "urea", label: "Ureia > 7 mmol/L" },
        { type: "yesno", key: "rr", label: "FR >= 30" },
        { type: "yesno", key: "bp", label: "PAS <90 ou PAD <=60" },
        { type: "yesno", key: "age", label: "Idade >= 65" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["confusion", "urea", "rr", "bp", "age"]);
        var risk = total <= 1 ? "baixo" : total === 2 ? "intermediario" : "alto";
        return { summary: total + "/5 - risco " + risk, text: "- CURB-65: " + total + "/5 (risco " + risk + ")." };
      }
    });
    configs.push({
      id: "psiport",
      short: "PSI/PORT",
      title: "PSI/PORT",
      fields: [
        { type: "number", key: "age", label: "Idade", placeholder: "anos" },
        { type: "option", key: "female", label: "Sexo", options: [["0", "Masculino"], ["-10", "Feminino (-10)"]] },
        { type: "yesno", key: "nursing", label: "Institucionalizado", points: 10 },
        { type: "yesno", key: "cancer", label: "Neoplasia", points: 30 },
        { type: "yesno", key: "liver", label: "Doença hepática", points: 20 },
        { type: "yesno", key: "chf", label: "Insuf. cardíaca", points: 10 },
        { type: "yesno", key: "cva", label: "Doença cerebrovascular", points: 10 },
        { type: "yesno", key: "renal", label: "Doença renal", points: 10 },
        { type: "yesno", key: "mental", label: "Alteração mental", points: 20 },
        { type: "yesno", key: "rr", label: "FR >=30", points: 20 },
        { type: "yesno", key: "sbp", label: "PAS <90", points: 20 },
        { type: "yesno", key: "temp", label: "Temp <35 ou >=40", points: 15 },
        { type: "yesno", key: "pulse", label: "Pulso >=125", points: 10 },
        { type: "yesno", key: "ph", label: "pH <7,35", points: 30 },
        { type: "yesno", key: "bun", label: "Ureia/BUN >=30 mg/dL", points: 20 },
        { type: "yesno", key: "na", label: "Na <130", points: 20 },
        { type: "yesno", key: "glucose", label: "Glicose >=250", points: 10 },
        { type: "yesno", key: "hct", label: "Ht <30%", points: 10 },
        { type: "yesno", key: "oxygen", label: "PaO2 <60 ou Sat <90", points: 10 },
        { type: "yesno", key: "effusion", label: "Derrame pleural", points: 10 }
      ],
      result: function (s) {
        var total = Math.max(0, (Number(s.age) || 0) + Number(s.female || 0) + scoreSum(s, ["nursing", "cancer", "liver", "chf", "cva", "renal", "mental", "rr", "sbp", "temp", "pulse", "ph", "bun", "na", "glucose", "hct", "oxygen", "effusion"]));
        var klass = total <= 50 ? "classe I" : total <= 70 ? "classe II" : total <= 90 ? "classe III" : total <= 130 ? "classe IV" : "classe V";
        var risk = total <= 70 ? "baixo" : total <= 90 ? "intermediario" : "alto";
        return { summary: total + " pts - " + klass + " / risco " + risk, text: "- PSI/PORT: " + total + " pts (" + klass + ", risco " + risk + ")." };
      }
    });
  
  return configs;
}
