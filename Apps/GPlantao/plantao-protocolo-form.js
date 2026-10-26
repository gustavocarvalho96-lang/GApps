var clinicalFormDrafts = {};
var clinicalFormPending = {};

function getClinicalFormDraft(protocol) {
  if (clinicalFormDrafts[protocol.id]) return clinicalFormDrafts[protocol.id];
  var saved;
  try { saved = JSON.parse(localStorage.getItem(clinicalDraftKey(protocol)) || "null"); } catch (error) {}
  var draft = saved && saved.version === 2 && saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers)
    ? { version: 2, answers: saved.answers, result: typeof saved.result === "string" ? saved.result : "", snapshot: typeof saved.snapshot === "string" ? saved.snapshot : "" }
    : { version: 2, answers: {}, result: "", snapshot: "" };
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
  clinicalFormDrafts[protocol.id] = { version: 2, answers: {}, result: "", snapshot: "" };
  persistClinicalForm(protocol, clinicalFormDrafts[protocol.id]);
  state.editableText = "";
}

function clinicalFormSchema(protocol) {
  var groups = ClinicalFormCore.schema(protocol.prescription);
  groups.push({ id: "notes", title: "OBSERVAÇÕES COMPLEMENTARES", fields: [{ id: "notes", label: "Outras informações fornecidas", kind: "text", options: [] }] });
  return groups;
}

function clinicalFormSections(protocol, draft) {
  return ClinicalFormCore.collect(clinicalFormSchema(protocol), draft.answers);
}

function clinicalFormSnapshot(protocol, draft) {
  return JSON.stringify(clinicalFormSections(protocol, draft));
}

function clinicalResultReady(protocol, draft) {
  return Boolean(draft.result.trim() && draft.snapshot === clinicalFormSnapshot(protocol, draft));
}

function copyProtocolText(protocol) {
  if (protocol.clinicalTemplate) {
    var draft = getClinicalFormDraft(protocol);
    if (!clinicalResultReady(protocol, draft)) {
      showToast(draft.result ? "O roteiro mudou. Gere a anamnese novamente." : "Preencha o roteiro e gere a anamnese primeiro.");
      return;
    }
    copyText(draft.result);
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
  renderChestPainGuide(root);
  headerActions.appendChild(textButton("Escores", "text-btn", function () {
    state.openGroups.scores = !state.openGroups.scores;
    render();
  }));
  var totalNode;
  var resultArea = document.createElement("textarea");
  resultArea.className = "clinical-result-editor";
  resultArea.setAttribute("aria-label", "Anamnese gerada pela IA — editável para revisão");
  resultArea.value = draft.result;
  resultArea.placeholder = "A anamnese será exibida aqui para revisão após a geração.";
  var status = div("clinical-status");
  status.setAttribute("role", "status");
  var copy = textButton("Copiar anamnese", "text-btn primary-btn", function () { copyProtocolText(protocol); });
  var generate;

  function update(saved, preserveStatus) {
    var sections = clinicalFormSections(protocol, draft);
    var answered = sections.reduce(function (sum, group) { return sum + group.items.filter(function (item) { return item.label !== "HEART — total informado pelos componentes"; }).length; }, 0);
    progress.textContent = answered + " campos preenchidos · " + (saved === false ? "Não foi possível salvar. Mantenha a aba aberta." : "Rascunho neste navegador");
    if (totalNode) {
      var total = sections.flatMap(function (group) { return group.items; }).find(function (item) { return item.label === "HEART — total informado pelos componentes"; });
      totalNode.textContent = total ? total.value + "/10 — soma dos componentes informados" : "Preencha os cinco componentes para somar. A versão do escore deve seguir o protocolo do serviço.";
    }
    var ready = clinicalResultReady(protocol, draft);
    copy.disabled = !ready;
    resultArea.hidden = !draft.result;
    if (draft.result && !ready && !preserveStatus) status.textContent = "O roteiro mudou. Gere novamente antes de copiar; o texto anterior permanece para consulta.";
    if (generate) generate.disabled = Boolean(clinicalFormPending[protocol.id]) || !sections.length;
  }

  groups.forEach(function (group, index) {
    var section = document.createElement("details");
    section.className = "clinical-section";
    section.open = index < 2;
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
    root.appendChild(section);
  });

  var finish = div("panel stack clinical-finish");
  var heading = document.createElement("h2"); heading.textContent = "Gerar anamnese"; finish.appendChild(heading);
  var privacy = document.createElement("p"); privacy.className = "clinical-intro";
  privacy.textContent = "Serão enviados à OpenAI apenas os campos preenchidos. Remova nome, documento e outros identificadores do paciente. Confira a redação antes de utilizar no prontuário.";
  finish.appendChild(privacy);
  var accessBox = div("clinical-field");
  var accessLabel = document.createElement("label");
  accessLabel.textContent = "Código de acesso da IA";
  accessLabel.htmlFor = "clinical-ai-access";
  var accessInput = document.createElement("input");
  accessInput.id = "clinical-ai-access";
  accessInput.type = "password";
  accessInput.autocomplete = "off";
  accessInput.placeholder = "O mesmo código utilizado na IA da HMA";
  accessBox.appendChild(accessLabel); accessBox.appendChild(accessInput);
  var initialConfig = window.GPLANTAO_HMA_API || {};
  accessBox.hidden = Boolean(window.GAppsCompat.storageGet("localStorage", initialConfig.tokenStorageKey || "gplantao-hma-api-token-v1"));
  finish.appendChild(accessBox);
  generate = textButton("Gerar anamnese com IA", "text-btn primary-btn", async function () {
    if (clinicalFormPending[protocol.id]) return;
    var sections = clinicalFormSections(protocol, draft);
    if (!sections.length) { status.textContent = "Preencha o roteiro antes de gerar a anamnese."; return; }
    var config = window.GPLANTAO_HMA_API || {};
    var endpoint = config.protocolUrl;
    if (!endpoint) { status.textContent = "A API dos protocolos ainda não foi configurada."; return; }
    var payload = JSON.stringify({ protocol: "dor-toracica", sections: sections });
    if (payload.length > 32000) { status.textContent = "O roteiro excede 32.000 caracteres. Resuma os detalhes antes de gerar."; return; }
    var compat = window.GAppsCompat;
    var tokenKey = config.tokenStorageKey || "gplantao-hma-api-token-v1";
    var token = compat.storageGet("localStorage", tokenKey);
    if (!token) {
      token = accessInput.value.trim();
      if (!token) {
        accessBox.hidden = false;
        status.textContent = "Digite o código de acesso da IA para gerar a anamnese.";
        accessInput.focus();
        return;
      }
      compat.storageSet("localStorage", tokenKey, token);
    }
    var snapshot = JSON.stringify(sections);
    clinicalFormPending[protocol.id] = true; update(); status.textContent = "Gerando a anamnese com os dados informados…";
    try {
      var response = await fetch(endpoint, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: payload, signal: compat.timeoutSignal(90000) });
      if (!(response.headers.get("content-type") || "").includes("application/json")) throw new Error("O servidor retornou uma resposta inválida.");
      var data = await response.json();
      if (response.status === 401) {
        compat.storageRemove("localStorage", tokenKey);
        accessBox.hidden = false;
      }
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar a anamnese.");
      if (typeof data.text !== "string" || !data.text.trim()) throw new Error("A API não retornou uma anamnese válida.");
      if (clinicalFormDrafts[protocol.id] !== draft) return;
      if (clinicalFormSnapshot(protocol, draft) !== snapshot) { status.textContent = "O roteiro mudou durante a geração. Gere novamente com as respostas atuais."; return; }
      draft.result = data.text.trim(); draft.snapshot = snapshot;
      accessInput.value = ""; accessBox.hidden = true;
      var saved = persistClinicalForm(protocol, draft);
      if (state.selectedId === protocol.id) state.editableText = draft.result;
      resultArea.value = draft.result;
      update(saved); status.textContent = "Anamnese gerada. Revise o texto e ajuste o que for necessário antes de copiar.";
    } catch (error) {
      status.textContent = error.name === "TimeoutError" || error.name === "AbortError" ? "A geração demorou demais. Tente novamente." : error.message === "Failed to fetch" ? "Não foi possível conectar ao servidor da IA." : error.message;
    } finally {
      delete clinicalFormPending[protocol.id]; update(undefined, true);
      if (!root.isConnected && state.selectedId === protocol.id) render();
    }
  });
  var actions = div("row"); actions.appendChild(generate); actions.appendChild(copy);
  finish.appendChild(actions); finish.appendChild(status); finish.appendChild(resultArea);
  resultArea.oninput = function () {
    draft.result = resultArea.value;
    state.editableText = draft.result;
    update(persistClinicalForm(protocol, draft));
  };
  root.appendChild(finish); body.appendChild(root); update();
}
