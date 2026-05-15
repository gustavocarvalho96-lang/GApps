function scoreConfigsTev() {
  var configs = [];
    configs.push({
      id: "wellsPe",
      short: "Wells TEP",
      title: "Wells para TEP",
      fields: [
        { type: "yesno", key: "dvt", label: "Sinais de TVP", points: 3 },
        { type: "yesno", key: "likely", label: "TEP mais provavel", points: 3 },
        { type: "yesno", key: "hr", label: "FC >100", points: 1.5 },
        { type: "yesno", key: "immob", label: "Imobilizacao/cirurgia", points: 1.5 },
        { type: "yesno", key: "prior", label: "TEP/TVP previa", points: 1.5 },
        { type: "yesno", key: "hemoptysis", label: "Hemoptise", points: 1 },
        { type: "yesno", key: "cancer", label: "Cancer ativo", points: 1 }
      ],
      result: function (s) {
        var total = scoreSum(s, ["dvt", "likely", "hr", "immob", "prior", "hemoptysis", "cancer"]);
        var risk = total <= 4 ? "TEP improvavel" : "TEP provavel";
        return { summary: total + " pts - " + risk, text: "- Wells TEP: " + total + " pts (" + risk + ")." };
      }
    });
    configs.push({
      id: "perc",
      short: "PERC",
      title: "PERC",
      fields: [
        { type: "yesno", key: "age", label: "Idade >=50" },
        { type: "yesno", key: "hr", label: "FC >=100" },
        { type: "yesno", key: "sat", label: "Sat <=94%" },
        { type: "yesno", key: "hemoptysis", label: "Hemoptise" },
        { type: "yesno", key: "estrogen", label: "Estrogenio" },
        { type: "yesno", key: "prior", label: "TEP/TVP previa" },
        { type: "yesno", key: "leg", label: "Edema unilateral" },
        { type: "yesno", key: "surgery", label: "Cirurgia/trauma 4 sem" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["age", "hr", "sat", "hemoptysis", "estrogen", "prior", "leg", "surgery"]);
        var risk = total === 0 ? "PERC negativo se baixa probabilidade pre-teste" : "PERC positivo";
        return { summary: total + "/8 - " + risk, text: "- PERC: " + total + "/8 (" + risk + ")." };
      }
    });
    configs.push({
      id: "wellsDvt",
      short: "Wells TVP",
      title: "Wells para TVP",
      fields: [
        { type: "yesno", key: "cancer", label: "Cancer ativo" },
        { type: "yesno", key: "paralysis", label: "Paralisia/imobilizacao MI" },
        { type: "yesno", key: "bed", label: "Acamado/cirurgia recente" },
        { type: "yesno", key: "tender", label: "Dor trajeto venoso" },
        { type: "yesno", key: "leg", label: "Perna inteira edemaciada" },
        { type: "yesno", key: "calf", label: "Panturrilha +3cm" },
        { type: "yesno", key: "pitting", label: "Edema cacifo unilateral" },
        { type: "yesno", key: "collateral", label: "Veias colaterais" },
        { type: "yesno", key: "prior", label: "TVP previa" },
        { type: "option", key: "alternative", label: "Diagnostico alternativo tao provavel", options: [["0", "Nao"], ["-2", "Sim (-2)"]] }
      ],
      result: function (s) {
        var total = scoreSum(s, ["cancer", "paralysis", "bed", "tender", "leg", "calf", "pitting", "collateral", "prior", "alternative"]);
        var risk = total <= 0 ? "baixo" : total <= 2 ? "moderado" : "alto";
        return { summary: total + " pts - risco " + risk, text: "- Wells TVP: " + total + " pts (risco " + risk + ")." };
      }
    });
    configs.push({
      id: "spesi",
      short: "sPESI",
      title: "sPESI",
      fields: [
        { type: "yesno", key: "age", label: "Idade >80" },
        { type: "yesno", key: "cancer", label: "Cancer" },
        { type: "yesno", key: "cardiopulm", label: "Doenca cardiopulmonar" },
        { type: "yesno", key: "hr", label: "FC >=110" },
        { type: "yesno", key: "bp", label: "PAS <100" },
        { type: "yesno", key: "sat", label: "Sat <90%" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["age", "cancer", "cardiopulm", "hr", "bp", "sat"]);
        var risk = total === 0 ? "baixo risco" : "alto risco";
        return { summary: total + "/6 - " + risk, text: "- sPESI: " + total + "/6 (" + risk + ")." };
      }
    });
    configs.push({
      id: "pesi",
      short: "PESI",
      title: "PESI",
      fields: [
        { type: "number", key: "age", label: "Idade", placeholder: "anos" },
        { type: "yesno", key: "male", label: "Masculino", points: 10 },
        { type: "yesno", key: "cancer", label: "Cancer", points: 30 },
        { type: "yesno", key: "hf", label: "Insuf. cardiaca", points: 10 },
        { type: "yesno", key: "lung", label: "Doenca pulmonar cronica", points: 10 },
        { type: "yesno", key: "hr", label: "FC >=110", points: 20 },
        { type: "yesno", key: "bp", label: "PAS <100", points: 30 },
        { type: "yesno", key: "temp", label: "Temp <36", points: 20 },
        { type: "yesno", key: "rr", label: "FR >=30", points: 20 },
        { type: "yesno", key: "sat", label: "Sat <90%", points: 20 },
        { type: "yesno", key: "mental", label: "Alteracao mental", points: 60 }
      ],
      result: function (s) {
        var total = (Number(s.age) || 0) + scoreSum(s, ["male", "cancer", "hf", "lung", "hr", "bp", "temp", "rr", "sat", "mental"]);
        var risk = total <= 65 ? "classe I" : total <= 85 ? "classe II" : total <= 105 ? "classe III" : total <= 125 ? "classe IV" : "classe V";
        return { summary: total + " pts - " + risk, text: "- PESI: " + total + " pts (" + risk + ")." };
      }
    });
  
  return configs;
}
