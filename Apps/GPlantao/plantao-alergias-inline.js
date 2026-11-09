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
      var added = action();
      if (added) {
        var line = inlineAllergyLine(area);
        if (line) {
          var value = line.text.replace(/[| \t]+$/, "");
          if (value) {
            area.setRangeText(value + " | ", line.start, line.end, "end");
            state.editableText = area.value;
            syncInlineAllergies(area);
            saveAnamneseDraft("Anamnese salva");
          }
        }
      }
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

  function normalize(value) {
    return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function refresh(event) {
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
    var term = normalize(line.text.slice(tokenStart, tokenEnd).trim());
    var known = ALLERGY_OPTIONS.concat(ALLERGY_QUICK_OPTIONS).some(function (medicine) {
      return normalize(medicine) === term;
    }) || normalize(NO_KNOWN_ALLERGIES_TEXT) === term;
    var options = div("inline-allergy-options");
    var matches = ALLERGY_QUICK_OPTIONS.concat(ALLERGY_OPTIONS).filter(function (item, index, list) {
      return (
        list.indexOf(item) === index &&
        term &&
        normalize(item).indexOf(term) >= 0
      );
    });
    function completeMedicine(medicine) {
      var replacement = (tokenStart ? " " : "") + medicine;
      var updated = line.text.slice(0, tokenStart) + replacement + line.text.slice(tokenEnd);
      var values = updated.split("|").map(function (item) { return item.trim(); }).filter(Boolean);
      values = values.filter(function (value, index, list) {
        return normalize(value) !== normalize(NO_KNOWN_ALLERGIES_TEXT) &&
          list.findIndex(function (other) { return normalize(other) === normalize(value); }) === index;
      });
      area.setRangeText(values.join(" | "), line.start, line.end, "end");
      state.editableText = area.value;
      syncInlineAllergies(area);
      saveAnamneseDraft("Anamnese salva");
      return true;
    }
    if (event && event.type === "input" && !event.isComposing &&
        /^insert/.test(event.inputType || "") && term && !known && matches.length === 1 &&
        area.selectionStart === area.selectionEnd && cursor >= line.start &&
        !line.text.slice(offset, tokenEnd).trim()) {
      allergyAction(function () { return completeMedicine(matches[0]); })();
      return;
    }
    var candidates = term && !known ? matches.slice(0, 5) : ALLERGY_QUICK_OPTIONS;
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
          if (!term || normalize(medicine).indexOf(term) < 0) {
            addAllergy(medicine);
            return true;
          }
          return completeMedicine(medicine);
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
  ["click", "keyup", "focus", "scroll", "input"].forEach(function (event) {
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
