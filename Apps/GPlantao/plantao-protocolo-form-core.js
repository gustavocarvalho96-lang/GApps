(function (root) {
  "use strict";
  var symptomChoices = ["Presente", "Negado", "Desconhecido"];
  var yesNo = ["Sim", "Não", "Desconhecido"];
  var multiple = ["Localização", "Circunstância de início", "Característica", "Irradiação", "Fatores de piora", "Fatores de melhora"];
  var booleanLabels = ["Dor reproduzida à palpação", "Dor reproduzida por movimentos", "Aumento recente da frequência, duração ou intensidade", "Ocorrência com esforços menores ou em repouso", "Episódios anteriores semelhantes", "Semelhança com angina ou IAM prévios", "HAS", "Diabetes", "Dislipidemia", "Obesidade", "Doença arterial coronariana", "Arritmias", "Valvopatia", "AVC / AIT", "Doença arterial periférica", "Doença renal crônica / diálise", "Asma / DPOC", "TVP / TEP prévios", "Aneurisma ou doença conhecida da aorta", "Doença do tecido conjuntivo", "Neoplasia", "Morte súbita", "Doença da aorta / dissecção", "Cirurgia / internação / imobilização recentes", "Viagem prolongada", "Trauma recente", "Uso de estrogênio", "Gestação / puerpério", "Trombofilia", "Infecção recente", "Procedimento vascular / manipulação da aorta recente", "Procedimento esofágico recente", "Dor presente durante o registro"];

  function schema(template) {
    var groups = [], group;
    template.split(/\r?\n/).forEach(function (line, index) {
      if (/^# /.test(line)) {
        group = { id: "s" + index, title: line.slice(2), fields: [] };
        groups.push(group);
        return;
      }
      var match = /^\s*([^:]+):\s*(.*)$/.exec(line);
      if (!group || !match) return;
      var label = match[1].trim(), tail = match[2].trim();
      if (/^(HEART, quando aplicável|EDACS, se utilizado como alternativa|Suspeita de TEP|Suspeita de síndrome aórtica aguda|SCA estabelecida)$/.test(label)) return;
      var field = { id: "f" + index, label: label, kind: "text", options: [] };
      var bracket = /^\[([^\]]+)\]$/.exec(tail);
      if (bracket) {
        field.options = bracket[1].split(" / ").filter(function (value) { return !/^(não investigado|não definida)$/.test(value); });
        field.kind = multiple.indexOf(label) >= 0 ? "multi" : "single";
      } else if (group.title === "SINTOMAS ASSOCIADOS" && tail === "não investigado") {
        field.kind = "single"; field.options = symptomChoices;
      } else if (booleanLabels.indexOf(label) >= 0) {
        field.kind = "single"; field.options = yesNo;
      } else if (/__\/10/.test(tail)) {
        field.kind = "pain";
        field.options = Array.from({ length: 11 }, function (_, value) { return String(value); });
      } else if (/^[HEART] — /.test(label) && tail === "__ pontos") {
        field.kind = "single"; field.options = ["0", "1", "2"]; field.heart = true;
      } else if (label === "Total" && group.title === "ESTRATIFICAÇÃO CORONARIANA") {
        field.kind = "heartTotal";
      }
      group.fields.push(field);
    });
    return groups.filter(function (item) { return item.fields.length; });
  }

  function toggle(field, current, option) {
    var selected = (current || []).slice();
    if (selected.indexOf(option) >= 0) return selected.filter(function (value) { return value !== option; });
    if (field.kind !== "multi" || option === "sem irradiação") return [option];
    return selected.filter(function (value) { return value !== "sem irradiação"; }).concat(option);
  }

  function value(field, answer) {
    if (!answer || typeof answer !== "object") return "";
    var selected = Array.isArray(answer.selected) ? answer.selected.filter(function (item) { return field.options.indexOf(item) >= 0; }).join("; ") : "";
    var text = typeof answer.text === "string" ? answer.text.trim() : "";
    return [selected, text].filter(Boolean).join(" — ");
  }

  function collect(groups, answers) {
    var heart = [];
    groups.forEach(function (group) { group.fields.forEach(function (field) {
      if (field.heart) {
        var selected = answers[field.id] && answers[field.id].selected;
        heart.push(Array.isArray(selected) && selected.length === 1 && /^[012]$/.test(selected[0]) ? Number(selected[0]) : null);
      }
    }); });
    var total = heart.length === 5 && heart.every(function (item) { return item !== null; }) ? String(heart.reduce(function (sum, item) { return sum + item; }, 0)) : "";
    return groups.map(function (group) {
      return { section: group.title, items: group.fields.map(function (field) {
        return { label: field.kind === "heartTotal" ? "HEART — total informado pelos componentes" : field.label, value: field.kind === "heartTotal" ? total : value(field, answers[field.id]) };
      }).filter(function (item) { return item.value; }) };
    }).filter(function (group) { return group.items.length; });
  }

  root.ClinicalFormCore = { schema: schema, toggle: toggle, value: value, collect: collect };
})(window);
