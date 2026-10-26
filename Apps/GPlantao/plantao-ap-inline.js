var AP_OPTIONS = [
  { label: "HAS", text: "HAS", search: "hipertensão arterial" },
  { label: "DM2", text: "DM2", search: "diabetes mellitus tipo 2" },
  { label: "DM1", text: "DM1", search: "diabetes mellitus tipo 1" },
  { label: "Dislipidemia", text: "Dislipidemia" },
  { label: "Obesidade", text: "Obesidade" },
  { label: "Asma", text: "Asma" },
  { label: "DPOC", text: "DPOC", search: "doença pulmonar obstrutiva crônica" },
  { label: "Insuficiência cardíaca", text: "Insuficiência cardíaca", search: "IC" },
  { label: "Doença coronariana", text: "Doença arterial coronariana", search: "DAC infarto IAM" },
  { label: "Fibrilação atrial", text: "Fibrilação atrial", search: "FA" },
  { label: "AVC prévio", text: "AVC prévio", search: "acidente vascular cerebral" },
  { label: "Doença renal crônica", text: "Doença renal crônica", search: "DRC" },
  { label: "Hipotireoidismo", text: "Hipotireoidismo" },
  { label: "Hipertireoidismo", text: "Hipertireoidismo" },
  { label: "Epilepsia", text: "Epilepsia" },
  { label: "Depressão", text: "Depressão" },
  { label: "Transtorno de ansiedade", text: "Transtorno de ansiedade" },
  { label: "Doença hepática crônica", text: "Doença hepática crônica", search: "cirrose hepatopatia" },
  { label: "Doença oncológica", text: "Doença oncológica", search: "câncer neoplasia" }
];
var AP_NEGATIVE = "Nega comorbidades";

function inlineApLine(area, section) {
  var pattern = section === "MUC"
    ? /^([ \t]*#?[ \t]*MUC[ \t]*:[ \t]*)([^\r\n]*)/im
    : /^([ \t]*#?[ \t]*AP[ \t]*:[ \t]*)([^\r\n]*)/im;
  var match = pattern.exec(area.value);
  return match ? {
    start: match.index + match[1].length,
    end: match.index + match[0].length,
    text: match[2]
  } : null;
}

function inlineApItems(line) {
  return line.text.split("|").map(function (item) { return item.trim(); }).filter(Boolean);
}

function writeInlineAp(area, items, section) {
  var line = inlineApLine(area, section);
  if (!line) return;
  var value = items.join(" | ");
  area.setRangeText(value, line.start, line.end, "end");
  state.editableText = area.value;
  saveAnamneseDraft("Anamnese salva");
}

function mountInlineAp(area) {
  mountInlineClinicalList(area, {
    section: "AP", title: "Antecedentes pessoais",
    options: AP_OPTIONS, negative: AP_NEGATIVE
  });
}

function mountInlineClinicalList(area, settings) {
  var wrap = area.parentNode;
  var panel = div("inline-allergy-panel inline-ap-panel hidden");
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", settings.title);
  wrap.appendChild(panel);

  function normalize(value) {
    return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function action(callback) {
    return function () {
      var scrollTop = area.scrollTop;
      var scrollLeft = area.scrollLeft;
      callback();
      area.focus({ preventScroll: true });
      var line = inlineApLine(area, settings.section);
      if (line) area.setSelectionRange(line.end, line.end);
      area.scrollTop = scrollTop;
      area.scrollLeft = scrollLeft;
      refresh();
    };
  }

  function position(line) {
    var mirror = document.createElement("div");
    var style = getComputedStyle(area);
    ["font", "letterSpacing", "lineHeight", "padding", "border", "boxSizing", "wordSpacing", "tabSize"].forEach(function (key) {
      mirror.style[key] = style[key];
    });
    mirror.style.cssText += ";position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;left:0;top:0;";
    mirror.style.width = area.clientWidth + "px";
    mirror.textContent = area.value.slice(0, line.end);
    var marker = document.createElement("span");
    marker.textContent = "\u200b";
    mirror.appendChild(marker);
    wrap.appendChild(mirror);
    var top = marker.offsetTop + (parseFloat(style.lineHeight) || 24) - area.scrollTop + 6;
    mirror.remove();
    panel.style.top = Math.max(8, Math.min(top, area.clientHeight - panel.offsetHeight - 8)) + "px";
  }

  function refresh() {
    var line = inlineApLine(area, settings.section);
    var cursor = area.selectionStart;
    var lineStart = line ? area.value.lastIndexOf("\n", Math.max(0, line.start - 1)) + 1 : -1;
    if (!line || cursor < lineStart || cursor > line.end || document.activeElement !== area) {
      panel.classList.add("hidden");
      return;
    }
    var items = inlineApItems(line);
    var offset = Math.max(0, cursor - line.start);
    var tokenStart = line.text.lastIndexOf("|", offset - 1) + 1;
    var nextSeparator = line.text.indexOf("|", offset);
    var tokenEnd = nextSeparator < 0 ? line.text.length : nextSeparator;
    var token = line.text.slice(tokenStart, tokenEnd).trim();
    var known = settings.options.some(function (item) { return normalize(item.text) === normalize(token); }) || normalize(token) === normalize(settings.negative);
    var term = known ? "" : normalize(token);
    panel.innerHTML = "";
    panel.classList.remove("hidden");
    var heading = div("allergy-menu-label");
    heading.textContent = settings.title;
    panel.appendChild(heading);
    var options = div("inline-allergy-options");
    settings.options.filter(function (item) {
      return !term || normalize(item.label + " " + item.text + " " + (item.search || "")).indexOf(term) >= 0;
    }).forEach(function (item) {
      var selected = items.some(function (value) { return normalize(value) === normalize(item.text); });
      var button = textButton(item.label, "allergy-chip" + (selected ? " active" : ""), action(function () {
        var next = items.filter(function (value) { return normalize(value) !== normalize(settings.negative); });
        if (selected) next = next.filter(function (value) { return normalize(value) !== normalize(item.text); });
        else if (term) {
          var replacement = (tokenStart ? " " : "") + item.text;
          var updated = line.text.slice(0, tokenStart) + replacement + line.text.slice(tokenEnd);
          next = inlineApItems({ text: updated }).filter(function (value) { return normalize(value) !== normalize(settings.negative); });
        } else next.push(item.text);
        writeInlineAp(area, next, settings.section);
      }));
      button.setAttribute("aria-pressed", String(selected));
      options.appendChild(button);
    });
    panel.appendChild(options);
    var negative = textButton(settings.negative, "text-btn" + (items.indexOf(settings.negative) >= 0 ? " active" : ""), action(function () {
      writeInlineAp(area, items.length === 1 && items[0] === settings.negative ? [] : [settings.negative], settings.section);
    }));
    negative.setAttribute("aria-pressed", String(items.indexOf(settings.negative) >= 0));
    panel.appendChild(negative);
    var registered = div("allergy-selected");
    items.forEach(function (value) {
      var remove = textButton(value + " ×", "allergy-tag", action(function () {
        writeInlineAp(area, items.filter(function (item) { return item !== value; }), settings.section);
      }));
      remove.setAttribute("aria-label", "Remover " + value);
      registered.appendChild(remove);
    });
    panel.appendChild(registered);
    position(line);
  }

  ["click", "keyup", "focus", "scroll", "input"].forEach(function (event) {
    area.addEventListener(event, refresh);
  });
  ["keydown", "keyup"].forEach(function (type) {
    area.addEventListener(type, function (event) {
      if (event.key === "Escape") panel.classList.add("hidden");
    });
  });
  wrap.addEventListener("focusout", function (event) {
    if (!wrap.contains(event.relatedTarget)) panel.classList.add("hidden");
  });
}
