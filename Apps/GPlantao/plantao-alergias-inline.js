function inlineAllergyLine(area) {
  var match = /^([ \t]*#\s*Alergia[ \t]*:[ \t]*)([^\r\n]*)/im.exec(area.value);
  if (!match) return null;
  return {
    start: match.index + match[1].length,
    end: match.index + match[0].length,
    text: match[2]
  };
}

function syncInlineAllergies(area) {
  var line = inlineAllergyLine(area);
  state.allergies = line
    ? line.text
        .split("|")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean)
    : [];
  saveAllergies();
  if (area.refreshAllergySuggestions) area.refreshAllergySuggestions();
}

function mountInlineAllergies(area, body) {
  var wrap = div("anamnese-inline-editor");
  var panel = div("inline-allergy-panel hidden");
  panel.setAttribute("aria-label", "Sugestões de alergias");
  area.setAttribute("aria-label", "Anamnese");
  wrap.appendChild(area);
  wrap.appendChild(panel);
  body.appendChild(wrap);

  function focusLine() {
    var line = inlineAllergyLine(area);
    area.focus({ preventScroll: true });
    if (line) area.setSelectionRange(line.end, line.end);
    refresh();
  }

  function allergyAction(action) {
    return function () {
      var scrollTop = area.scrollTop;
      var scrollLeft = area.scrollLeft;
      action();
      focusLine();
      area.scrollTop = scrollTop;
      area.scrollLeft = scrollLeft;
      refresh();
    };
  }

  function positionPanel(line) {
    var mirror = document.createElement("div");
    var style = getComputedStyle(area);
    [
      "font",
      "letterSpacing",
      "lineHeight",
      "padding",
      "border",
      "boxSizing",
      "wordSpacing",
      "tabSize"
    ].forEach(function (key) {
      mirror.style[key] = style[key];
    });
    mirror.style.cssText +=
      ";position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;left:0;top:0;";
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
    var line = inlineAllergyLine(area);
    var cursor = area.selectionStart;
    var lineStart = line ? area.value.lastIndexOf("\n", Math.max(0, line.start - 1)) + 1 : -1;
    if (!line || cursor < lineStart || cursor > line.end || document.activeElement !== area) {
      panel.classList.add("hidden");
      return;
    }
    panel.innerHTML = "";
    panel.classList.remove("hidden");
    var offset = Math.max(0, cursor - line.start);
    var tokenStart = line.text.lastIndexOf("|", offset - 1) + 1;
    var nextSeparator = line.text.indexOf("|", offset);
    var tokenEnd = nextSeparator < 0 ? line.text.length : nextSeparator;
    var term = line.text.slice(tokenStart, tokenEnd).trim().toLocaleLowerCase("pt-BR");
    var options = div("inline-allergy-options");
    var matches = ALLERGY_OPTIONS.filter(function (item, index, list) {
      return (
        list.indexOf(item) === index &&
        ALLERGY_QUICK_OPTIONS.indexOf(item) < 0 &&
        term &&
        item.toLocaleLowerCase("pt-BR").indexOf(term) >= 0
      );
    }).slice(0, 5);
    var candidates = ALLERGY_QUICK_OPTIONS.concat(matches);
    candidates.forEach(function (medicine) {
      var selectedMedicine = state.allergies.find(function (item) {
        return item.toLocaleLowerCase("pt-BR") === medicine.toLocaleLowerCase("pt-BR");
      });
      var button = textButton(
        medicine,
        "allergy-chip" + (selectedMedicine ? " active" : ""),
        allergyAction(function () {
          if (selectedMedicine) {
            removeAllergy(selectedMedicine);
            return;
          }
          if (!term || medicine.toLocaleLowerCase("pt-BR").indexOf(term) < 0) {
            addAllergy(medicine);
            return;
          }
          var replacement = (tokenStart ? " " : "") + medicine;
          area.setRangeText(replacement, line.start + tokenStart, line.start + tokenEnd, "end");
          state.editableText = area.value;
          syncInlineAllergies(area);
          saveAnamneseDraft("Anamnese salva");
        })
      );
      button.setAttribute("aria-pressed", String(Boolean(selectedMedicine)));
      options.appendChild(button);
    });
    panel.appendChild(options);
    var negative = textButton(
      "Nega alergias medicamentosas",
      "text-btn",
      allergyAction(function () {
        setNoKnownAllergies();
      })
    );
    var selected = state.allergies.length === 1 && state.allergies[0] === NO_KNOWN_ALLERGIES_TEXT;
    negative.classList.toggle("active", selected);
    negative.setAttribute("aria-pressed", String(selected));
    panel.appendChild(negative);
    var registered = div("allergy-selected");
    state.allergies.forEach(function (medicine) {
      var remove = textButton(
        medicine + " ×",
        "allergy-tag",
        allergyAction(function () {
          removeAllergy(medicine);
        })
      );
      remove.setAttribute("aria-label", "Remover " + medicine);
      registered.appendChild(remove);
    });
    panel.appendChild(registered);
    positionPanel(line);
  }
  area.refreshAllergySuggestions = refresh;
  area.addEventListener("click", function () {
    var line = inlineAllergyLine(area);
    if (!line || area.selectionStart !== area.selectionEnd) return;
    var lineStart = area.value.lastIndexOf("\n", Math.max(0, line.start - 1)) + 1;
    if (area.selectionStart >= lineStart && area.selectionStart < line.start) {
      area.setSelectionRange(line.end, line.end);
    }
  });
  ["click", "keyup", "focus", "scroll"].forEach(function (event) {
    area.addEventListener(event, refresh);
  });
  area.addEventListener("keydown", function (event) {
    if (event.key === "Escape") panel.classList.add("hidden");
  });
  area.addEventListener("keyup", function (event) {
    if (event.key === "Escape") panel.classList.add("hidden");
  });
  wrap.addEventListener("focusout", function (event) {
    if (!wrap.contains(event.relatedTarget)) panel.classList.add("hidden");
  });
}
