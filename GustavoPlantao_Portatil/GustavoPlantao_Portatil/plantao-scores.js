function scoreField(label, input) {
  var wrap = div("score-field");
  var title = document.createElement("label");
  title.textContent = label;
  wrap.appendChild(title);
  wrap.appendChild(input);
  return wrap;
}

function numberInput(value, placeholder, onInput) {
  var input = document.createElement("input");
  input.type = "number";
  input.inputMode = "decimal";
  input.placeholder = placeholder || "";
  input.value = value || "";
  input.oninput = function () { onInput(input.value); };
  input.onchange = render;
  return input;
}

function selectInput(value, options, onChange) {
  var select = document.createElement("select");
  options.forEach(function (option) {
    var opt = document.createElement("option");
    opt.value = option[0];
    opt.textContent = option[1];
    select.appendChild(opt);
  });
  select.value = String(value);
  select.onchange = function () { onChange(select.value); };
  return select;
}

function heartAgePoints(age) {
  age = Number(age);
  if (!age && age !== 0) return 0;
  if (age < 45) return 0;
  if (age < 65) return 1;
  return 2;
}

function heartResult() {
  var s = state.scores.heart;
  var score = Number(s.history) + Number(s.ecg) + heartAgePoints(s.age) + Number(s.riskFactors) + Number(s.troponin);
  var risk = score <= 3 ? "baixo" : score <= 6 ? "intermediario" : "alto";
  return {
    score: score,
    risk: risk,
    text: "- HEART: " + score + "/10 (" + risk + "). H " + s.history + ", ECG " + s.ecg + ", idade " + heartAgePoints(s.age) + ", fatores " + s.riskFactors + ", troponina " + s.troponin + "."
  };
}

function binScore(value, bins, emptyValue) {
  value = Number(value);
  if (!value && value !== 0) return emptyValue || 0;
  for (var i = 0; i < bins.length; i += 1) {
    if (value < bins[i][0]) return bins[i][1];
  }
  return bins[bins.length - 1][1];
}

function graceCreatininePoints(creatinineMgDl) {
  var cr = Number(creatinineMgDl);
  if (!cr && cr !== 0) return 0;
  var umol = cr * 88.4;
  if (umol <= 34) return 2;
  if (umol <= 70) return 5;
  if (umol <= 105) return 8;
  if (umol <= 140) return 11;
  if (umol <= 176) return 14;
  if (umol <= 353) return 23;
  return 31;
}

function graceResult() {
  var s = state.scores.grace;
  var age = binScore(s.age, [[40, 0], [50, 18], [60, 36], [70, 55], [80, 73], [999, 91]]);
  var hr = binScore(s.heartRate, [[70, 0], [90, 7], [110, 13], [150, 23], [200, 36], [999, 46]]);
  var sbp = binScore(s.systolicBp, [[80, 63], [100, 58], [120, 47], [140, 37], [160, 26], [200, 11], [999, 0]]);
  var cr = graceCreatininePoints(s.creatinine);
  var killip = [0, 0, 21, 43, 64][Number(s.killip)] || 0;
  var arrest = Number(s.arrest) ? 43 : 0;
  var st = Number(s.stDeviation) ? 30 : 0;
  var markers = Number(s.markers) ? 15 : 0;
  var score = age + hr + sbp + cr + killip + arrest + st + markers;
  var risk = score <= 108 ? "baixo (<1% intra-hospitalar)" : score <= 140 ? "intermediario (1-3% intra-hospitalar)" : "alto (>3% intra-hospitalar)";
  return {
    score: score,
    risk: risk,
    text: "- GRACE: " + score + " pts (" + risk + "). Idade " + age + ", FC " + hr + ", PAS " + sbp + ", Cr " + cr + ", Killip " + killip + ", PCR " + arrest + ", ST " + st + ", marcadores " + markers + "."
  };
}

function ensureScore(id, defaults) {
  if (!state.scores.items[id]) {
    state.scores.items[id] = {};
    Object.keys(defaults || {}).forEach(function (key) {
      state.scores.items[id][key] = defaults[key];
    });
  }
  return state.scores.items[id];
}

function yesNoField(scoreId, label, key, points) {
  var score = ensureScore(scoreId, {});
  if (score[key] === undefined) score[key] = 0;
  return scoreField(label, selectInput(score[key], [["0", "Nao"], [String(points || 1), "Sim"]], function (value) {
    score[key] = Number(value);
    render();
  }));
}

function optionField(scoreId, label, key, options) {
  var score = ensureScore(scoreId, {});
  if (score[key] === undefined) score[key] = Number(options[0][0]);
  return scoreField(label, selectInput(score[key], options, function (value) {
    score[key] = Number(value);
    render();
  }));
}

function smallNumberField(scoreId, label, key, placeholder) {
  var score = ensureScore(scoreId, {});
  if (score[key] === undefined) score[key] = "";
  return scoreField(label, numberInput(score[key], placeholder || "", function (value) {
    score[key] = value;
  }));
}

function scoreSum(score, keys) {
  return keys.reduce(function (sum, key) {
    return sum + Number(score[key] || 0);
  }, 0);
}

function renderSimpleScore(parent, config) {
  var score = ensureScore(config.id, config.defaults || {});
  var box = div("score-box");
  var title = div("score-title");
  title.textContent = config.title;
  box.appendChild(title);
  var grid = div("score-grid");
  config.fields.forEach(function (field) {
    if (field.type === "number") grid.appendChild(smallNumberField(config.id, field.label, field.key, field.placeholder));
    if (field.type === "yesno") grid.appendChild(yesNoField(config.id, field.label, field.key, field.points));
    if (field.type === "option") grid.appendChild(optionField(config.id, field.label, field.key, field.options));
  });
  box.appendChild(grid);
  var result = config.result(score);
  var resultBox = div("score-result");
  resultBox.textContent = result.summary;
  box.appendChild(resultBox);
  box.appendChild(textButton("Inserir " + config.short, "text-btn primary-btn", function () {
    insertScoreLine(config.short, result.text);
    render();
  }));
  parent.appendChild(box);
}

function scoreConfigsFor(tab) {
  if (tab === "cardio") return scoreConfigsCardio();
  if (tab === "resp") return scoreConfigsRespiratorio();
  if (tab === "neuro") return scoreConfigsNeuro();
  if (tab === "abdome") return scoreConfigsAbdome();
  if (tab === "tev") return scoreConfigsTev();
  return [];
}

function insertScoreLine(label, line) {
  var text = state.editableText || "";
  var scoreMarker = "--> Scores :";
  var conductMarker = "--> Conduta";
  var lines;
  if (text.indexOf(scoreMarker) < 0) {
    var insert = "\n" + scoreMarker + "\n" + line + "\n";
    var conductIndex = text.indexOf(conductMarker);
    state.editableText = conductIndex >= 0
      ? text.slice(0, conductIndex).trimEnd() + "\n" + insert + "\n" + text.slice(conductIndex).trimStart()
      : text.trimEnd() + "\n" + insert;
    return;
  }
  lines = text.split("\n");
  var markerIndex = lines.indexOf(scoreMarker);
  var replaced = false;
  for (var i = markerIndex + 1; i < lines.length; i += 1) {
    if (lines[i].indexOf("--> ") === 0) break;
    if (lines[i].indexOf("- " + label + ":") === 0) {
      lines[i] = line;
      replaced = true;
      break;
    }
  }
  if (!replaced) lines.splice(markerIndex + 1, 0, line);
  state.editableText = lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function renderScorePanel(body) {
  var panel = div("panel stack score-panel");
  var title = div("panel-title");
  title.textContent = "Scores";
  panel.appendChild(title);

  var tabs = div("score-tabs");
  [
    ["cardio", "Cardio"],
    ["resp", "Resp/Infecção"],
    ["neuro", "Neuro"],
    ["abdome", "Abdome/Oro"],
    ["tev", "TEV"]
  ].forEach(function (item) {
    tabs.appendChild(textButton(item[1], "text-btn" + (state.scores.tab === item[0] ? " active" : ""), function () {
      state.scores.tab = item[0];
      render();
    }));
  });
  panel.appendChild(tabs);

  if (state.scores.tab === "cardio") {
  var heart = div("score-box");
  var heartTitle = div("score-title");
  heartTitle.textContent = "HEART";
  heart.appendChild(heartTitle);
  var heartGrid = div("score-grid");
  heartGrid.appendChild(scoreField("Historia", selectInput(state.scores.heart.history, [["0", "0 - pouco/nada sugestiva"], ["1", "1 - moderada"], ["2", "2 - muito sugestiva"]], function (value) {
    state.scores.heart.history = Number(value);
    render();
  })));
  heartGrid.appendChild(scoreField("ECG", selectInput(state.scores.heart.ecg, [["0", "0 - normal"], ["1", "1 - inespecifico"], ["2", "2 - ST significativo"]], function (value) {
    state.scores.heart.ecg = Number(value);
    render();
  })));
  heartGrid.appendChild(scoreField("Idade", numberInput(state.scores.heart.age, "anos", function (value) {
    state.scores.heart.age = value;
  })));
  heartGrid.appendChild(scoreField("Fatores", selectInput(state.scores.heart.riskFactors, [["0", "0 - nenhum"], ["1", "1 - 1 a 2"], ["2", "2 - >=3/DAC"]], function (value) {
    state.scores.heart.riskFactors = Number(value);
    render();
  })));
  heartGrid.appendChild(scoreField("Troponina", selectInput(state.scores.heart.troponin, [["0", "0 - normal"], ["1", "1 - 1 a 3x"], ["2", "2 - >3x"]], function (value) {
    state.scores.heart.troponin = Number(value);
    render();
  })));
  heart.appendChild(heartGrid);
  var heartResultBox = div("score-result");
  var heartData = heartResult();
  heartResultBox.textContent = heartData.score + "/10 - risco " + heartData.risk;
  heart.appendChild(heartResultBox);
  heart.appendChild(textButton("Inserir HEART", "text-btn primary-btn", function () {
    insertScoreLine("HEART", heartResult().text);
    render();
  }));
  panel.appendChild(heart);

  var grace = div("score-box");
  var graceTitle = div("score-title");
  graceTitle.textContent = "GRACE";
  grace.appendChild(graceTitle);
  var graceGrid = div("score-grid");
  graceGrid.appendChild(scoreField("Idade", numberInput(state.scores.grace.age, "anos", function (value) {
    state.scores.grace.age = value;
  })));
  graceGrid.appendChild(scoreField("FC", numberInput(state.scores.grace.heartRate, "bpm", function (value) {
    state.scores.grace.heartRate = value;
  })));
  graceGrid.appendChild(scoreField("PAS", numberInput(state.scores.grace.systolicBp, "mmHg", function (value) {
    state.scores.grace.systolicBp = value;
  })));
  graceGrid.appendChild(scoreField("Creatinina", numberInput(state.scores.grace.creatinine, "mg/dL", function (value) {
    state.scores.grace.creatinine = value;
  })));
  graceGrid.appendChild(scoreField("Killip", selectInput(state.scores.grace.killip, [["1", "I"], ["2", "II"], ["3", "III"], ["4", "IV"]], function (value) {
    state.scores.grace.killip = Number(value);
    render();
  })));
  graceGrid.appendChild(scoreField("PCR adm.", selectInput(state.scores.grace.arrest, [["0", "Nao"], ["1", "Sim"]], function (value) {
    state.scores.grace.arrest = Number(value);
    render();
  })));
  graceGrid.appendChild(scoreField("Desvio ST", selectInput(state.scores.grace.stDeviation, [["0", "Nao"], ["1", "Sim"]], function (value) {
    state.scores.grace.stDeviation = Number(value);
    render();
  })));
  graceGrid.appendChild(scoreField("Marcadores", selectInput(state.scores.grace.markers, [["0", "Nao"], ["1", "Sim"]], function (value) {
    state.scores.grace.markers = Number(value);
    render();
  })));
  grace.appendChild(graceGrid);
  var graceResultBox = div("score-result");
  var graceData = graceResult();
  graceResultBox.textContent = graceData.score + " pts - risco " + graceData.risk;
  grace.appendChild(graceResultBox);
  grace.appendChild(textButton("Inserir GRACE", "text-btn primary-btn", function () {
    insertScoreLine("GRACE", graceResult().text);
    render();
  }));
  panel.appendChild(grace);
  }

  scoreConfigsFor(state.scores.tab).forEach(function (config) {
    renderSimpleScore(panel, config);
  });

  body.appendChild(panel);
}
