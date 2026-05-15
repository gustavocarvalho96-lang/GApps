function renderFreeGroups(body) {
  var box = div("stack free-groups");
  var tabs = div("free-topic-row");
  var content = div("free-topic-content");
  [["dor", "Dor/Febre"], ["gastro", "Nausea/Gastro"], ["resp", "Alergia/Respiratorio"], ["antibiotics", "Antibioticos"], ["orientacoes", "Orientacoes/Sinais de Alarme"]].forEach(function (group) {
    var key = group[0];
    tabs.appendChild(textButton(group[1], "text-btn free-topic-btn" + (state.openGroups[key] ? " active" : ""), function () {
      state.openGroups[key] = !state.openGroups[key];
      render();
    }));
    if (state.openGroups[key]) {
      var row = div("row");
      var source = key === "antibiotics"
        ? ((window.antibioticOptions || []).map(function (o) { return [o.label, o.value]; }))
        : ((window.freeGroups && window.freeGroups[key]) || []);
      source.slice().sort(function (a, b) { return a[0].localeCompare(b[0], "pt-BR"); }).forEach(function (item) {
        row.appendChild(dotButton(item[0], function () {
          var text = key === "antibiotics" ? item[1].replace(/^\s*Uso oral:\s*/i, "") : item[1];
          addTextToEditable(item[0], text);
        }));
      });
      content.appendChild(row);
    }
  });
  box.appendChild(tabs);
  if (content.children.length) box.appendChild(content);
  body.appendChild(box);
}
