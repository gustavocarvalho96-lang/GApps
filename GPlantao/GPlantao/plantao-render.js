function renderNav(containerId, items, selectedId, emptyText) {
  var node = el(containerId);
  if (!node) return;
  node.innerHTML = "";
  if (!items.length) {
    var empty = div("empty-note");
    empty.textContent = emptyText || "Nenhum item.";
    node.appendChild(empty);
    return;
  }
  for (var i = 0; i < items.length; i += 1) {
    (function (item) {
      var b = textButton("", "nav-btn" + (item.id === selectedId ? " active" : ""), function () {
        selectProtocol(item.id);
      });
      var title = document.createElement("span");
      title.className = "nav-title";
      title.textContent = item.title;
      var meta = document.createElement("span");
      meta.className = "nav-meta";
      meta.textContent = item.category || "";
      b.appendChild(title);
      b.appendChild(meta);
      node.appendChild(b);
    })(items[i]);
  }
}

function renderOptions(protocol, parent) {
  if (isEditable(protocol.id)) {
    var resetRow = div("section row");
    resetRow.appendChild(textButton("Limpar template", "text-btn", function () {
      state.editableText = getInitialText(protocol);
      state.labInput = "";
      state.labOutput = "";
      saveAnamneseDraft("Anamnese salva");
      render();
    }));
    if (protocol.genderedTemplate) {
      resetRow.appendChild(textButton("Masculino", "text-btn" + (state.anamneseGender === "masculino" ? " active" : ""), function () {
        setAnamneseGender("masculino");
      }));
      resetRow.appendChild(textButton("Feminino", "text-btn" + (state.anamneseGender === "feminino" ? " active" : ""), function () {
        setAnamneseGender("feminino");
      }));
    }
    parent.appendChild(resetRow);

    if (protocol.snippets && protocol.snippets.standardExam) {
      var otoOroBlock = div("section toggle-block");
      var anamneseButtons = div("row");
      var snippets = protocol.snippets || {};
      var standardExam = snippets.standardExam && snippets.standardExam.text;
      var psychSnippets = snippets.psych || [];
      var psychActive = psychSnippets.some(function (item) {
        return (state.editableText || "").indexOf(item[1]) >= 0;
      });
      anamneseButtons.appendChild(textButton((snippets.standardExam && snippets.standardExam.label) || "Padrão", "text-btn" + (standardExam && (state.editableText || "").indexOf(standardExam) >= 0 ? " active" : ""), function () {
        toggleAnamneseExam(standardExam);
      }));
      anamneseButtons.appendChild(textButton("Oto/Oro", "text-btn", function () {
        state.openGroups.otoOro = !state.openGroups.otoOro;
        render();
      }));
      anamneseButtons.appendChild(textButton("Psiq", "text-btn" + (state.openGroups.psych || psychActive ? " active" : ""), function () {
        state.openGroups.psych = !state.openGroups.psych;
        render();
      }));
      anamneseButtons.appendChild(textButton("Scores", "text-btn" + (state.openGroups.scores ? " active" : ""), function () {
        state.openGroups.scores = !state.openGroups.scores;
        render();
      }));
      otoOroBlock.appendChild(anamneseButtons);
      if (state.openGroups.otoOro) {
        var examRow = div("row");
        (snippets.otoOro || []).forEach(function (item) {
          examRow.appendChild(textButton(item[0], "text-btn" + ((state.editableText || "").indexOf(item[1]) >= 0 ? " active" : ""), function () {
            toggleAnamneseExam(item[1]);
          }));
        });
        otoOroBlock.appendChild(examRow);
      }
      if (state.openGroups.psych) {
        var psychRow = div("row");
        psychSnippets.forEach(function (item) {
          psychRow.appendChild(textButton(item[0], "text-btn" + ((state.editableText || "").indexOf(item[1]) >= 0 ? " active" : ""), function () {
            toggleAnamneseExam(item[1]);
          }));
        });
        otoOroBlock.appendChild(psychRow);
      }
      parent.appendChild(otoOroBlock);
    }
  }

  if (Array.isArray(protocol.snippets)) {
    var admin = div("section row");
    (protocol.snippets || []).forEach(function (item) {
      admin.appendChild(dotButton(item[0], function () {
        state.editableText = item[1];
        render();
      }));
    });
    parent.appendChild(admin);
  }

  if (protocol.antibioticOptions) {
    var row = div("section row");
    protocol.antibioticOptions.forEach(function (opt, index) {
      row.appendChild(dotButton(opt.label, function () {
        state.selectedAntibiotic = index;
        render();
      }, index === state.selectedAntibiotic));
    });
    parent.appendChild(row);
  }
  if (protocol.options && protocol.options.length) {
    var row2 = div("section row");
    protocol.options.forEach(function (opt, index) {
      row2.appendChild(dotButton(opt.label, function () {
        state.selectedOption = index;
        render();
      }, index === state.selectedOption));
    });
    parent.appendChild(row2);
  }
  if (protocol.orientationOptions && protocol.orientationOptions.length) {
    var orientationRow = div("section row");
    protocol.orientationOptions.forEach(function (opt, index) {
      orientationRow.appendChild(dotButton(opt.label, function () {
        state.selectedOrientationOption = index;
        render();
      }, index === state.selectedOrientationOption));
    });
    parent.appendChild(orientationRow);
  }
  if (protocol.referralTemplates) {
    var refs = div("section stack");
    var r1 = div("row");
    protocol.referralTemplates.forEach(function (template, index) {
      r1.appendChild(dotButton(template.label, function () {
        state.selectedReferral = index;
        state.editableText = buildReferralText(template, state.referralMode);
        render();
      }, index === state.selectedReferral));
    });
    var r2 = div("row");
    [["Avaliacao ambulatorial", "ambulatorial"], ["Avaliacao urgente", "urgente"], ["Investigacao complementar", "investigacao"]].forEach(function (item) {
      r2.appendChild(dotButton(item[0], function () {
        state.referralMode = item[1];
        state.editableText = buildReferralText(protocol.referralTemplates[state.selectedReferral], state.referralMode);
        render();
      }, item[1] === state.referralMode));
    });
    refs.appendChild(r1);
    refs.appendChild(r2);
    parent.appendChild(refs);
  }
  (protocol.addOns || []).forEach(function (addOn) {
    var row = div("section row");
    row.appendChild(textButton(state[addOn.stateKey] ? addOn.removeLabel : addOn.addLabel, "text-btn" + (state[addOn.stateKey] ? " active" : ""), function () {
      state[addOn.stateKey] = !state[addOn.stateKey];
      render();
    }));
    parent.appendChild(row);
  });
  var currentPrescription = getPrescription(protocol);
  var hasStandaloneDipirona = /dipirona/i.test(currentPrescription.replace(/Escopolamina \+ dipirona/gi, ""));
  if (!isEditable(protocol.id) && (hasStandaloneDipirona || state.useParacetamolAlt)) {
    var troca = div("section row");
    troca.appendChild(textButton(state.useParacetamolAlt ? "Voltar para dipirona" : "Alergia a dipirona", "text-btn" + (state.useParacetamolAlt ? " active" : ""), function () {
      state.useParacetamolAlt = !state.useParacetamolAlt;
      render();
    }));
    parent.appendChild(troca);
  }
  if (!isEditable(protocol.id) && (/escopolamina \+ dipirona/i.test(currentPrescription) || state.useEscopolaminaParacetamolAlt)) {
    var trocaEscopolamina = div("section row");
    trocaEscopolamina.appendChild(textButton(state.useEscopolaminaParacetamolAlt ? "Voltar para escopolamina + dipirona" : "Alergia a dipirona", "text-btn" + (state.useEscopolaminaParacetamolAlt ? " active" : ""), function () {
      state.useEscopolaminaParacetamolAlt = !state.useEscopolaminaParacetamolAlt;
      render();
    }));
    parent.appendChild(trocaEscopolamina);
  }
}

function renderEditable(protocol, body) {
  if (protocol.freeGroupsEnabled) renderFreeGroups(body);
  if (protocol.labTranscription) {
    var lab = div("panel stack reavaliacao-lab-panel");
    var header = div("reavaliacao-panel-head");
    var titleWrap = div("");
    var label = div("panel-title");
    label.textContent = "Exames laboratoriais";
    var hint = div("panel-hint");
    hint.textContent = "Cole o resultado bruto; use Auto para detectar a origem ou escolha manualmente.";
    titleWrap.appendChild(label);
    titleWrap.appendChild(hint);
    var sourceRow = div("row lab-source-row");
    (protocol.labSources || []).forEach(function (source) {
      var hiddenClass = " manual-source-hidden";
      sourceRow.appendChild(textButton(source.label, "text-btn lab-source-btn " + source.className + hiddenClass + (state.labSource === source.source ? " active" : ""), function () {
        transcribeCurrentLabs(input, source.source);
        showToast("Transcrito: " + labSourceLabel());
        render();
      }));
    });
    header.appendChild(titleWrap);
    header.appendChild(sourceRow);
    var input = document.createElement("textarea");
    input.className = "small lab-input";
    input.placeholder = "Cole aqui o texto do exame";
    input.value = state.labInput || "";
    input.oninput = function () {
      state.labInput = input.value;
      if (!state.labInput.trim()) {
        state.labOutput = "";
        state.labDetectedSource = "";
        output.textContent = "Cole o exame acima para transcrever automaticamente.";
        sourceBadge.textContent = "Origem: " + (state.labSource === "auto" ? "aguardando detecÃ§Ã£o" : labSourceLabel());
        return;
      }
      transcribeCurrentLabs(input, state.labSource);
      output.textContent = state.labOutput;
      sourceBadge.textContent = "Origem: " + (state.labDetectedSource || labSourceLabel());
    };
    input.onkeydown = function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        transcribeCurrentLabs(input);
        showToast("Transcrito: " + labSourceLabel());
        render();
      }
    };
    var output = document.createElement("pre");
    output.className = "lab-output";
    output.textContent = state.labOutput || "Cole o exame acima para transcrever automaticamente.";
    var sourceBadge = div("lab-detected-source");
    sourceBadge.textContent = "Origem: " + (state.labDetectedSource || (state.labSource === "auto" ? "aguardando detecção" : labSourceLabel()));
    var actions = div("row");
    actions.appendChild(textButton("Copiar resultado", "text-btn primary-btn", function () {
      transcribeCurrentLabs(input);
      copyText(state.labOutput);
      render();
    }));
    actions.appendChild(textButton("Inserir no template", "text-btn", function () {
      state.labInput = input.value;
      insertLabOutputIntoReavaliacao();
      render();
    }));
    actions.appendChild(textButton("Limpar exames", "text-btn", function () {
      state.labInput = "";
      state.labOutput = "";
      render();
    }));
    lab.appendChild(header);
    lab.appendChild(input);
    lab.appendChild(actions);
    var preview = div("lab-preview");
    var previewTitle = div("panel-title");
    previewTitle.textContent = "Transcricao pronta";
    preview.appendChild(previewTitle);
    preview.appendChild(sourceBadge);
    preview.appendChild(output);
    lab.appendChild(preview);
    body.appendChild(lab);
  }
  if (protocol.labTranscription) {
    var templateTitle = div("panel-title template-title");
    templateTitle.textContent = "Template de reavaliacao";
    body.appendChild(templateTitle);
  }
  var area = document.createElement("textarea");
  area.className = protocol.labTranscription ? "template-editor" : (protocol.id === "anamnese" ? "anamnese-editor" : "");
  area.value = state.editableText;
  area.oninput = function () {
    state.editableText = area.value;
    saveAnamneseDraft("Anamnese salva");
  };
  body.appendChild(area);
}

function renderProtocol(protocol) {
  var content = el("content");
  content.innerHTML = "";
  if (!protocol) return;
  if (isEditable(protocol.id) && state.editableText === "") state.editableText = getInitialText(protocol);

  var card = div("card");
  var header = div("header");
  var titleBox = div("");
  var h = document.createElement("h1");
  h.textContent = protocol.title;
  var p = document.createElement("p");
  p.textContent = protocol.category || "";
  titleBox.appendChild(h);
  titleBox.appendChild(p);
  var actions = div("header-actions");
  actions.appendChild(textButton("Copiar tudo", "text-btn primary-btn", function () { copyText(finalText(protocol)); }));
  var headerLeft = div("header-left");
  headerLeft.appendChild(titleBox);
  headerLeft.appendChild(actions);
  header.appendChild(headerLeft);
  card.appendChild(header);
  renderOptions(protocol, card);

  var body = div("body stack");
  if (isEditable(protocol.id)) {
    renderEditable(protocol, body);
  } else {
    var panel = div("panel");
    var t = div("panel-title");
    t.textContent = "Receita";
    var pre = document.createElement("pre");
    pre.textContent = getPrescription(protocol);
    panel.appendChild(t);
    panel.appendChild(pre);
    body.appendChild(panel);
    var orientation = getOrientation(protocol);
    if (orientation) {
      var orient = div("panel");
      var ot = div("panel-title");
      ot.textContent = "Orientacoes";
      var op = document.createElement("pre");
      op.textContent = orientation;
      orient.appendChild(ot);
      orient.appendChild(op);
      body.appendChild(orient);
    }
  }
  card.appendChild(body);
  content.appendChild(card);
}

function renderScoreSidebar() {
  var app = document.querySelector(".app");
  var sidebar = el("scoreSidebar");
  var content = el("scorePanelContent");
  if (!sidebar || !content) return;
  content.innerHTML = "";
  var shouldShow = !!state.openGroups.scores;
  sidebar.classList.toggle("hidden", !shouldShow);
  if (app) app.classList.toggle("scores-open", shouldShow);
  if (shouldShow) renderScorePanel(content);
}

function render() {
  var lists = filtered();
  var protocol = currentProtocol();
  if (protocol) state.selectedId = protocol.id;
  renderNav("quickList", lists.quick, state.selectedId, "Nenhuma acao rapida.");
  renderNav("recipeList", lists.recipes, state.selectedId, "Nenhuma receita encontrada.");
  renderScoreSidebar();
  renderProtocol(protocol);
}
