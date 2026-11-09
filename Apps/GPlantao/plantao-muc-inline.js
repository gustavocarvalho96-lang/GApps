var MUC_OPTIONS = [
  "Losartana", "Enalapril", "Captopril", "Anlodipino", "Hidroclorotiazida",
  "Clortalidona", "Furosemida", "Espironolactona", "Atenolol", "Carvedilol",
  "Metoprolol", "Propranolol", "Metformina", "Gliclazida", "Glibenclamida",
  "Dapagliflozina", "Empagliflozina", "Insulina NPH", "Insulina regular",
  "Insulina glargina", "Sinvastatina", "Atorvastatina", "Rosuvastatina",
  "AAS", "Clopidogrel", "Rivaroxabana", "Apixabana", "Varfarina",
  "Levotiroxina", "Omeprazol", "Pantoprazol", "Sertralina", "Fluoxetina",
  "Escitalopram", "Amitriptilina", "Clonazepam", "Diazepam", "Carbamazepina",
  "Ácido valproico", "Fenobarbital", "Levetiracetam", "Salbutamol",
  "Budesonida", "Formoterol", "Tiotrópio", "Alopurinol"
].map(function (medicine) {
  var aliases = {
    "AAS": "ácido acetilsalicílico aspirina",
    "Anlodipino": "amlodipina amlodipino",
    "Ácido valproico": "valproato"
  };
  return { label: medicine, text: medicine, search: aliases[medicine] || "" };
});

function mountInlineMuc(area) {
  var openSchedule = mountMucSchedule(area);
  mountInlineClinicalList(area, {
    section: "MUC",
    title: "Medicamentos de uso contínuo",
    options: MUC_OPTIONS,
    negative: "Nega uso de medicações contínuas",
    sameItem: function (left, right) {
      return mucMedicineName(left).toLocaleLowerCase("pt-BR") === mucMedicineName(right).toLocaleLowerCase("pt-BR");
    },
    onSelect: function (medicine) { queueMicrotask(function () { openSchedule(medicine); }); }
  });
}

function mucMedicineName(value) {
  return value.replace(/\s*\([\d.,½¼¾]+-[\d.,½¼¾]+-[\d.,½¼¾]+\)\s*$/, "").trim();
}

function mountMucSchedule(area) {
  var dialog = document.createElement("dialog");
  dialog.className = "muc-schedule-dialog";
  dialog.setAttribute("aria-label", "Horários de tomada");
  var form = document.createElement("form");
  var title = document.createElement("h2");
  var help = document.createElement("p");
  help.textContent = "Selecione as tomadas informadas ou ajuste a quantidade de cada período.";
  var presets = div("muc-schedule-presets");
  var fields = div("muc-schedule-fields");
  var inputs = [];
  var activeIndex = -1, originalValue = "";
  var error = div("muc-schedule-error");
  error.setAttribute("role", "status");

  function close() {
    dialog.close();
    area.focus({ preventScroll: true });
    area.dispatchEvent(new Event("click"));
  }

  function apply(values) {
    var line = inlineApLine(area, "MUC");
    var items = line ? inlineApItems(line) : [];
    if (!line || items[activeIndex] !== originalValue) {
      error.textContent = "A anotação mudou. Feche e abra os horários novamente.";
      return;
    }
    var medicine = mucMedicineName(originalValue);
    items[activeIndex] = medicine + (values ? " (" + values.join("-") + ")" : "");
    writeInlineAp(area, items, "MUC", /\|\s*$/.test(line.text));
    close();
  }

  [
    ["Manhã", ["1", "0", "0"]],
    ["Tarde", ["0", "1", "0"]],
    ["Noite", ["0", "0", "1"]],
    ["Manhã e noite", ["1", "0", "1"]],
    ["Manhã, tarde e noite", ["1", "1", "1"]]
  ].forEach(function (preset) {
    var button = textButton(preset[0], "allergy-chip", function () { apply(preset[1]); });
    button.type = "button";
    presets.appendChild(button);
  });
  ["Manhã", "Tarde", "Noite"].forEach(function (period) {
    var label = document.createElement("label");
    label.textContent = period;
    var input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.maxLength = 5;
    input.setAttribute("aria-label", "Quantidade de tomada: " + period);
    label.appendChild(input);
    fields.appendChild(label);
    inputs.push(input);
  });
  var customLabel = document.createElement("p");
  customLabel.textContent = "Quantidade por tomada (ex.: ½, 1 ou 2)";
  var actions = div("muc-schedule-actions");
  var notApplicable = textButton("Não aplicável", "text-btn", function () { apply(null); });
  notApplicable.type = "button";
  var cancel = textButton("Cancelar", "text-btn", close);
  cancel.type = "button";
  var save = document.createElement("button");
  save.type = "submit";
  save.className = "text-btn primary-btn";
  save.textContent = "Aplicar horários";
  actions.append(notApplicable, cancel, save);
  form.append(title, help, presets, customLabel, fields, error, actions);
  dialog.appendChild(form);
  area.parentNode.appendChild(dialog);
  form.onsubmit = function (event) {
    event.preventDefault();
    var values = inputs.map(function (input) { return input.value.trim().replace(".", ","); });
    if (values.some(function (value) { return !/^(?:\d{1,2}(?:,\d{1,2})?|[½¼¾])$/.test(value); }) ||
        values.every(function (value) { return Number(value.replace(",", ".")) === 0; })) {
      error.textContent = "Informe as quantidades por período ou escolha Não aplicável.";
      return;
    }
    apply(values);
  };
  dialog.addEventListener("cancel", function (event) { event.preventDefault(); close(); });

  return function (medicine) {
    if (dialog.open || !area.isConnected) return;
    var line = inlineApLine(area, "MUC");
    var items = line ? inlineApItems(line) : [];
    activeIndex = items.findIndex(function (item) {
      return mucMedicineName(item).toLocaleLowerCase("pt-BR") === mucMedicineName(medicine).toLocaleLowerCase("pt-BR");
    });
    if (activeIndex < 0) return;
    originalValue = items[activeIndex];
    title.textContent = mucMedicineName(originalValue);
    var schedule = /\(([\d.,½¼¾]+)-([\d.,½¼¾]+)-([\d.,½¼¾]+)\)\s*$/.exec(originalValue);
    inputs.forEach(function (input, index) { input.value = schedule ? schedule[index + 1] : "0"; });
    error.textContent = "";
    dialog.showModal();
  };
}
