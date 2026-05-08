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
  
  return configs;
}
