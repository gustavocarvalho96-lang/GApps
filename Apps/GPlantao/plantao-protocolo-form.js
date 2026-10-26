var clinicalFormDrafts = {};
var clinicalFormPending = {};
var clinicalFormTabs = {};

function getClinicalFormDraft(protocol) {
  if (clinicalFormDrafts[protocol.id]) return clinicalFormDrafts[protocol.id];
  var saved;
  try { saved = JSON.parse(localStorage.getItem(clinicalDraftKey(protocol)) || "null"); } catch (error) {}
  var draft = saved && saved.version === 2 && saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers)
    ? { version: 2, answers: saved.answers, result: typeof saved.result === "string" ? saved.result : "", snapshot: typeof saved.snapshot === "string" ? saved.snapshot : "", reassessmentResult: typeof saved.reassessmentResult === "string" ? saved.reassessmentResult : "", reassessmentSnapshot: typeof saved.reassessmentSnapshot === "string" ? saved.reassessmentSnapshot : "" }
    : { version: 2, answers: {}, result: "", snapshot: "", reassessmentResult: "", reassessmentSnapshot: "" };
  clinicalFormDrafts[protocol.id] = draft;
  if (saved && typeof saved === "object" && ("legacyText" in saved || "includeLegacy" in saved || "text" in saved)) persistClinicalForm(protocol, draft);
  return draft;
}

function persistClinicalForm(protocol, draft) {
  try {
    localStorage.setItem(clinicalDraftKey(protocol), JSON.stringify(draft));
    return true;
  } catch (error) { return false; }
}

function resetClinicalForm(protocol) {
  clinicalFormTabs[protocol.id] = "inicial";
  clinicalFormDrafts[protocol.id] = { version: 2, answers: {}, result: "", snapshot: "", reassessmentResult: "", reassessmentSnapshot: "" };
  persistClinicalForm(protocol, clinicalFormDrafts[protocol.id]);
  state.editableText = "";
}

function clinicalFormSchema(protocol) {
  var groups = ClinicalFormCore.schema(protocol.prescription);
  groups.push({ id: "notes", title: "OBSERVAÇÕES COMPLEMENTARES", fields: [{ id: "notes", label: "Outras informações fornecidas", kind: "text", options: [] }] });
  groups.forEach(function (group, index) { group.stage = index >= 11 ? "reavaliacao" : "inicial"; });
  return groups;
}

function clinicalFormSections(protocol, draft) {
  return ClinicalFormCore.collect(clinicalFormSchema(protocol), draft.answers);
}

function clinicalGenerationPayload(protocol, draft, mode) {
  var schema = clinicalFormSchema(protocol);
  var initial = ClinicalFormCore.collect(schema.filter(function (group) { return group.stage === "inicial"; }), draft.answers);
  if (mode !== "reavaliacao") return { protocol: "dor-toracica", sections: initial };
  var later = ClinicalFormCore.collect(schema.filter(function (group) { return group.stage === "reavaliacao"; }), draft.answers);
  return { protocol: "dor-toracica", initialSections: initial, sections: later };
}

function clinicalFormSnapshot(protocol, draft, mode) {
  return JSON.stringify(clinicalGenerationPayload(protocol, draft, mode));
}

function clinicalOutputKeys(mode) {
  return mode === "reavaliacao" ? { text: "reassessmentResult", snapshot: "reassessmentSnapshot" } : { text: "result", snapshot: "snapshot" };
}

function clinicalResultReady(protocol, draft, mode) {
  var keys = clinicalOutputKeys(mode);
  return Boolean(draft[keys.text] && draft[keys.text].trim() && draft[keys.snapshot] === clinicalFormSnapshot(protocol, draft, mode));
}

function copyProtocolText(protocol, mode) {
  if (protocol.clinicalTemplate) {
    mode = mode || clinicalFormTabs[protocol.id] || "inicial";
    var draft = getClinicalFormDraft(protocol);
    var result = draft[clinicalOutputKeys(mode).text];
    if (!clinicalResultReady(protocol, draft, mode)) {
      showToast(result ? "O roteiro mudou. Gere o texto novamente." : "Preencha a etapa e gere o texto primeiro.");
      return;
    }
    copyText(result);
    return;
  }
  copyText(finalText(protocol));
}

function renderClinicalForm(protocol, body, headerActions) {
  var draft = getClinicalFormDraft(protocol);
  var groups = clinicalFormSchema(protocol);
  var root = div("clinical-form");
  state.editableText = draft.result;
  var introduction = document.createElement("p");
  introduction.className = "clinical-intro";
  introduction.textContent = "Marque as respostas e acrescente detalhes. Campos não respondidos não serão enviados à IA. Clique em uma opção marcada para desmarcá-la.";
  root.appendChild(introduction);
  var progress = div("clinical-progress");
  progress.setAttribute("role", "status");
  root.appendChild(progress);
  var tablist = div("clinical-tabs");
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Etapas do protocolo de dor torácica");
  var panels = {}, tabs = {};
  var stageNote = document.createElement("p");
  stageNote.className = "clinical-intro";
  var stages = [{ id: "inicial", label: "Avaliação inicial", hint: "Etapas 1 a 11 · História, exame físico e ECG." }, { id: "reavaliacao", label: "Reavaliação", hint: "Etapas 12 a 16 · Troponinas, estratificação, outros escores, reavaliação e observações. Preencha conforme os resultados estiverem disponíveis." }];
  function activateStage(stage, focus) {
    clinicalFormTabs[protocol.id] = stage;
    state.editableText = draft[clinicalOutputKeys(stage).text] || "";
    stages.forEach(function (item) {
      var selected = item.id === stage;
      tabs[item.id].setAttribute("aria-selected", String(selected));
      tabs[item.id].tabIndex = selected ? 0 : -1;
      panels[item.id].hidden = !selected;
      if (selected) stageNote.textContent = item.hint;
    });
    if (focus) tabs[stage].focus();
  }
  stages.forEach(function (stage, index) {
    var tab = textButton(stage.label, "text-btn clinical-tab", function () { activateStage(stage.id); });
    tab.id = protocol.id + "-tab-" + stage.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", protocol.id + "-panel-" + stage.id);
    tab.onkeydown = function (event) {
      var next;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = stages[1 - index].id;
      if (event.key === "Home") next = stages[0].id;
      if (event.key === "End") next = stages[1].id;
      if (next) { event.preventDefault(); activateStage(next, true); }
    };
    tabs[stage.id] = tab;
    tablist.appendChild(tab);
    var panel = div("clinical-tabpanel");
    panel.id = protocol.id + "-panel-" + stage.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panels[stage.id] = panel;
  });
  root.appendChild(tablist);
  root.appendChild(stageNote);
  renderChestPainGuide(root);
  stages.forEach(function (stage) { root.appendChild(panels[stage.id]); });
  activateStage(clinicalFormTabs[protocol.id] === "reavaliacao" ? "reavaliacao" : "inicial");
  headerActions.appendChild(textButton("Escores", "text-btn", function () {
    state.openGroups.scores = !state.openGroups.scores;
    render();
  }));
  var totalNode;
  var outputUpdates = [];

  function update(saved, preserveStatus) {
    var sections = clinicalFormSections(protocol, draft);
    var answered = sections.reduce(function (sum, group) { return sum + group.items.filter(function (item) { return item.label !== "HEART — total informado pelos componentes"; }).length; }, 0);
    progress.textContent = answered + " campos preenchidos · " + (saved === false ? "Não foi possível salvar. Mantenha a aba aberta." : "Rascunho neste navegador");
    if (totalNode) {
      var total = sections.flatMap(function (group) { return group.items; }).find(function (item) { return item.label === "HEART — total informado pelos componentes"; });
      totalNode.textContent = total ? total.value + "/10 — soma dos componentes informados" : "Preencha os cinco componentes para somar. A versão do escore deve seguir o protocolo do serviço.";
    }
    outputUpdates.forEach(function (refresh) { refresh(saved, preserveStatus); });
  }

  groups.forEach(function (group, index) {
    var section = document.createElement("details");
    section.className = "clinical-section";
    section.open = index < 2 || index === 11;
    var summary = document.createElement("summary");
    summary.textContent = (index + 1) + ". " + group.title;
    section.appendChild(summary);
    var grid = div("clinical-field-grid");
    group.fields.forEach(function (field) {
      var wrap = div("clinical-field" + (field.options.length ? " clinical-field-wide" : ""));
      var label = document.createElement("label");
      label.textContent = field.label + (field.heart ? " — pontos conforme versão adotada" : "");
      var controlId = "clinical-" + field.id;
      var answer = draft.answers[field.id] || { selected: [], text: "" };
      if (field.kind === "heartTotal") {
        totalNode = div("clinical-heart-total");
        wrap.appendChild(label); wrap.appendChild(totalNode); grid.appendChild(wrap);
        return;
      }
      var options;
      var buttons = [];
      if (field.options.length) {
        options = div("clinical-options");
        options.setAttribute("role", "group");
        options.setAttribute("aria-label", field.label);
        field.options.forEach(function (option) {
          var button = textButton(option, "text-btn clinical-option", function () {
            answer = draft.answers[field.id] || { selected: [], text: "" };
            answer.selected = ClinicalFormCore.toggle(field, answer.selected, option);
            draft.answers[field.id] = answer;
            refreshButtons();
            update(persistClinicalForm(protocol, draft));
          });
          buttons.push({ node: button, option: option });
          options.appendChild(button);
        });
        function refreshButtons() {
          buttons.forEach(function (item) {
            var selected = Array.isArray(answer.selected) && answer.selected.indexOf(item.option) >= 0;
            item.node.setAttribute("aria-pressed", String(selected));
            item.node.classList.toggle("active", selected);
          });
        }
        refreshButtons();
      }
      var input = document.createElement("input");
      input.type = "text";
      input.id = controlId;
      input.maxLength = 2000;
      input.value = typeof answer.text === "string" ? answer.text : "";
      input.placeholder = field.options.length ? "Detalhes ou outra resposta (opcional)" : "Não informado";
      input.setAttribute("aria-label", field.label + (field.options.length ? " — detalhes" : ""));
      label.htmlFor = controlId;
      input.oninput = function () {
        answer = draft.answers[field.id] || { selected: [], text: "" };
        answer.text = input.value;
        draft.answers[field.id] = answer;
        update(persistClinicalForm(protocol, draft));
      };
      wrap.appendChild(label);
      if (options) wrap.appendChild(options);
      wrap.appendChild(input);
      grid.appendChild(wrap);
    });
    section.appendChild(grid);
    panels[group.stage].appendChild(section);
  });

  stages.forEach(function (stage) {
    outputUpdates.push(renderClinicalGeneration(protocol, draft, panels[stage.id], stage.id, root, update));
  });
  body.appendChild(root);
  update();
}

function renderClinicalGeneration(protocol, draft, panel, mode, root, onUpdate) {
  var reassessment = mode === "reavaliacao";
  var keys = clinicalOutputKeys(mode);
  var pendingKey = protocol.id + ":" + mode;
  var noun = reassessment ? "reavaliação" : "anamnese";
  var finish = div("panel stack clinical-finish");
  var heading = document.createElement("h2");
  heading.textContent = reassessment ? "Gerar reavaliação" : "Gerar anamnese inicial";
  finish.appendChild(heading);
  var privacy = document.createElement("p");
  privacy.className = "clinical-intro";
  privacy.textContent = reassessment
    ? "A IA usará os novos resultados e achados desta aba para redigir a evolução, com a avaliação inicial como contexto. Remova identificadores do paciente e revise o texto antes de copiar."
    : "A IA usará os campos preenchidos na avaliação inicial. Remova identificadores do paciente e revise o texto antes de copiar.";
  finish.appendChild(privacy);
  var accessBox = div("clinical-field");
  var accessLabel = document.createElement("label");
  accessLabel.textContent = "Código de acesso da IA";
  accessLabel.htmlFor = "clinical-ai-access-" + mode;
  var accessInput = document.createElement("input");
  accessInput.id = accessLabel.htmlFor;
  accessInput.type = "password";
  accessInput.autocomplete = "off";
  accessInput.placeholder = "O mesmo código utilizado na IA da HMA";
  accessBox.appendChild(accessLabel); accessBox.appendChild(accessInput);
  finish.appendChild(accessBox);
  var resultArea = document.createElement("textarea");
  resultArea.className = "clinical-result-editor";
  resultArea.setAttribute("aria-label", reassessment ? "Reavaliação gerada pela IA — editável para revisão" : "Anamnese gerada pela IA — editável para revisão");
  resultArea.value = draft[keys.text] || "";
  resultArea.placeholder = "O texto será exibido aqui para revisão após a geração.";
  var status = div("clinical-status");
  status.setAttribute("role", "status");
  var copy = textButton("Copiar " + noun, "text-btn primary-btn", function () { copyProtocolText(protocol, mode); });
  var generate;

  function refresh(saved, preserveStatus) {
    var payload = clinicalGenerationPayload(protocol, draft, mode);
    var ready = clinicalResultReady(protocol, draft, mode);
    resultArea.hidden = !draft[keys.text];
    copy.disabled = !ready;
    if (draft[keys.text] && !ready && !preserveStatus) status.textContent = "Os dados usados neste texto mudaram. Gere novamente antes de copiar.";
    generate.disabled = Boolean(clinicalFormPending[pendingKey]) || !payload.sections.length;
    var config = window.GPLANTAO_HMA_API || {};
    accessBox.hidden = Boolean(window.GAppsCompat.storageGet("localStorage", config.tokenStorageKey || "gplantao-hma-api-token-v1"));
  }

  generate = textButton("Gerar " + noun + " com IA", "text-btn primary-btn", async function () {
    if (clinicalFormPending[pendingKey]) return;
    var payloadData = clinicalGenerationPayload(protocol, draft, mode);
    if (!payloadData.sections.length) { status.textContent = "Preencha os dados desta etapa antes de gerar o texto."; return; }
    var config = window.GPLANTAO_HMA_API || {};
    var endpoint = reassessment ? config.reassessmentUrl : config.protocolUrl;
    if (!endpoint) { status.textContent = "A API de " + noun + " ainda não foi configurada."; return; }
    var payload = JSON.stringify(payloadData);
    if (payload.length > 32000) { status.textContent = "O roteiro excede 32.000 caracteres. Resuma os detalhes antes de gerar."; return; }
    var compat = window.GAppsCompat;
    var tokenKey = config.tokenStorageKey || "gplantao-hma-api-token-v1";
    var token = compat.storageGet("localStorage", tokenKey);
    if (!token) {
      token = accessInput.value.trim();
      if (!token) {
        accessBox.hidden = false;
        status.textContent = "Digite o código de acesso da IA para gerar o texto.";
        accessInput.focus(); return;
      }
      compat.storageSet("localStorage", tokenKey, token);
    }
    var snapshot = payload;
    clinicalFormPending[pendingKey] = true;
    onUpdate();
    status.textContent = "Gerando " + noun + " com os dados informados…";
    try {
      var response = await fetch(endpoint, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: payload, signal: compat.timeoutSignal(90000) });
      if (!(response.headers.get("content-type") || "").includes("application/json")) throw new Error("O servidor retornou uma resposta inválida.");
      var data = await response.json();
      if (response.status === 401) {
        compat.storageRemove("localStorage", tokenKey);
        accessBox.hidden = false;
      }
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o texto de " + noun + ".");
      if (typeof data.text !== "string" || !data.text.trim()) throw new Error("A API não retornou um texto válido.");
      if (clinicalFormDrafts[protocol.id] !== draft) return;
      if (clinicalFormSnapshot(protocol, draft, mode) !== snapshot) { status.textContent = "Os dados mudaram durante a geração. Gere novamente com as respostas atuais."; return; }
      draft[keys.text] = data.text.trim();
      draft[keys.snapshot] = snapshot;
      accessInput.value = "";
      var saved = persistClinicalForm(protocol, draft);
      if (state.selectedId === protocol.id && (clinicalFormTabs[protocol.id] || "inicial") === mode) state.editableText = draft[keys.text];
      resultArea.value = draft[keys.text];
      onUpdate(saved);
      status.textContent = "Texto gerado. Revise e ajuste o que for necessário antes de copiar.";
    } catch (error) {
      status.textContent = error.name === "TimeoutError" || error.name === "AbortError" ? "A geração demorou demais. Tente novamente." : error.message === "Failed to fetch" ? "Não foi possível conectar ao servidor da IA." : error.message;
    } finally {
      delete clinicalFormPending[pendingKey];
      onUpdate(undefined, true);
      if (!root.isConnected && state.selectedId === protocol.id) render();
    }
  });
  var actions = div("row");
  actions.appendChild(generate); actions.appendChild(copy);
  finish.appendChild(actions); finish.appendChild(status); finish.appendChild(resultArea);
  resultArea.oninput = function () {
    draft[keys.text] = resultArea.value;
    if (state.selectedId === protocol.id && (clinicalFormTabs[protocol.id] || "inicial") === mode) state.editableText = draft[keys.text];
    onUpdate(persistClinicalForm(protocol, draft));
  };
  panel.appendChild(finish);
  return refresh;
}
