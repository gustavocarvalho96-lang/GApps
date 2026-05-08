function scoreConfigsCardio() {
  var configs = [];
    configs.push({
      id: "chadsvasc",
      short: "CHA2DS2-VASc",
      title: "CHA2DS2-VASc",
      fields: [
        { type: "yesno", key: "chf", label: "IC/FE <=40%" },
        { type: "yesno", key: "has", label: "HAS" },
        { type: "option", key: "age", label: "Idade", options: [["0", "<65"], ["1", "65-74"], ["2", ">=75"]] },
        { type: "yesno", key: "dm", label: "Diabetes" },
        { type: "yesno", key: "stroke", label: "AVC/AIT/TE", points: 2 },
        { type: "yesno", key: "vascular", label: "Doenca vascular" },
        { type: "yesno", key: "female", label: "Sexo feminino" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["chf", "has", "age", "dm", "stroke", "vascular", "female"]);
        var risk = total === 0 ? "baixo" : total === 1 ? "baixo-intermediario" : "elevado";
        return { summary: total + " pts - risco " + risk, text: "- CHA2DS2-VASc: " + total + " pts (risco tromboembolico " + risk + ")." };
      }
    });
    configs.push({
      id: "hasbled",
      short: "HAS-BLED",
      title: "HAS-BLED",
      fields: [
        { type: "yesno", key: "htn", label: "HAS/PAS >160" },
        { type: "yesno", key: "renal", label: "Funcao renal alterada" },
        { type: "yesno", key: "liver", label: "Funcao hepatica alterada" },
        { type: "yesno", key: "stroke", label: "AVC previo" },
        { type: "yesno", key: "bleed", label: "Sangramento previo/predisposicao" },
        { type: "yesno", key: "inr", label: "INR labil" },
        { type: "yesno", key: "elderly", label: "Idade >65" },
        { type: "yesno", key: "drugs", label: "AINE/antiagregante" },
        { type: "yesno", key: "alcohol", label: "Alcool" }
      ],
      result: function (s) {
        var total = scoreSum(s, ["htn", "renal", "liver", "stroke", "bleed", "inr", "elderly", "drugs", "alcohol"]);
        var risk = total >= 3 ? "alto risco de sangramento" : "baixo/moderado";
        return { summary: total + "/9 - " + risk, text: "- HAS-BLED: " + total + "/9 (" + risk + ")." };
      }
    });
  
  return configs;
}
