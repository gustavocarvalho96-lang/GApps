const OCR_PASSES = [
        { id: "base", label: "Base", scale: 1.6, grayscale: false, contrast: 1.15, threshold: null },
        { id: "gray", label: "Cinza", scale: 2.0, grayscale: true, contrast: 1.8, threshold: null },
        { id: "binary", label: "Binario", scale: 2.2, grayscale: true, contrast: 2.25, threshold: 170 },
      ];

      const state = {
        legendInput: "",
        rawInput: "",
        uploadPreview: "",
        ocrStatus: "Cole o print com Ctrl+V, arraste a imagem ou escolha o arquivo.",
        ocrBusy: false,
        ocrLog: "",
        pasteHint: "Ctrl+V habilitado para print.",
        precisionMode: true,
        includeFastTrack: true,
        passSummary: "",
        generatedImageDataUrl: "",
        rotationStartIndex: 0,
        showLegend: false,
        showUpload: false,
        showExtractedPatients: false,
        showReadingSummary: false,
        verificationMode: false,
        verificationResults: [],
        verificationDebug: { baselineNames: [], detectedNames: [], matchedNames: [] },
        verificationPreview: "",
        verificationBusy: false,
        pasteTarget: "main",
        leftPanelOrder: ["legend", "upload", "extracted"],
        verificationBase: [],
      };

      const $ = (id) => document.getElementById(id);
      const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
      const escapeAttribute = escapeHtml;
      const safeImageSrc = (value) => {
        const src = String(value || "");
        return src.startsWith("data:image/") ? escapeAttribute(src) : "";
      };
      const setHtml = (id, html) => {
        $(id).innerHTML = html;
      };
      const appAssetUrl = (path) => new URL(path, window.location.href).href;

      function showToast(message) {
        let toast = $("actionToast");
        if (!toast) {
          toast = document.createElement("div");
          toast.id = "actionToast";
          toast.className = "action-toast";
          document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => {
          toast.classList.remove("show");
        }, 1600);
      }

      function normalizeText(value) {
        return (value || "").replace(/\u00A0/g, " ").replace(/[|\\/_*~=`^]+/g, " ").replace(/[“”"'´`]+/g, " ").replace(/[\[\]{}<>]+/g, " ").replace(/[,:;]+/g, " ").replace(/\s+/g, " ").trim();
      }
      function isLatinLetter(ch) {
        const code = ch.charCodeAt(0);
        return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 192 && code <= 255);
      }
      function sanitizeName(value) {
        const text = normalizeText(value);
        let out = "";
        for (const ch of text) out += isLatinLetter(ch) || ch === " " || ch === "-" ? ch : " ";
        return out.replace(/\s+/g, " ").trim();
      }
      function titleCaseName(value) {
        return sanitizeName(value).toLowerCase().replace(/\b([a-zà-ÿ])/g, (m) => m.toUpperCase()).trim();
      }
      function normalizeLoose(value) {
        return sanitizeName(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      }
      function isTruthyFlag(value, accepted = []) {
        const normalized = normalizeLoose(value).toLowerCase();
        return ["sim", "s", ...accepted].includes(normalized);
      }
      function nameLooksSuspicious(name) {
        const safe = sanitizeName(name);
        if (!safe || safe.length < 6 || safe.split(" ").filter(Boolean).length < 2) return true;
        return /(\bTrack\b|\bOutros\b|\bClinica\b|\bMedica\b|\bOdontologia\b|\bPaciente\b|\bIdade\b|\bTempo\b|\bAtendimento\b|\bEspecialidade\b|\bSetor\b)/i.test(safe);
      }
      function levenshteinSimilarity(a, b) {
        const s1 = normalizeLoose(a);
        const s2 = normalizeLoose(b);
        if (!s1 || !s2) return 0;
        if (s1 === s2) return 1;
        const matrix = Array.from({ length: s1.length + 1 }, () => Array(s2.length + 1).fill(0));
        for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= s1.length; i++) {
          for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
          }
        }
        const maxLen = Math.max(s1.length, s2.length);
        return maxLen ? 1 - matrix[s1.length][s2.length] / maxLen : 0;
      }
      function parseOfficeConfig(text) {
        const base = Array.from({ length: 9 }, (_, idx) => ({ id: String(idx + 1), name: "", active: false }));
        const map = new Map(base.map((item) => [item.id, item]));
        text.split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
          const [key, ...rest] = line.split("=");
          const id = (key || "").trim();
          if (!map.has(id)) return;
          let name = rest.join("=").trim();
          let active = true;
          if (name.startsWith("!")) { active = false; name = name.slice(1).trim(); }
          map.set(id, { id, name, active: active && Boolean(name) });
        });
        return base.map((item) => map.get(item.id) || item);
      }
      function serializeOfficeConfig(offices) {
        return offices.map((office) => {
          const name = office.name.trim();
          if (!name) return "";
          return `${office.id}=${office.active ? name : `!${name}`}`;
        }).filter(Boolean).join("\n");
      }
      function parsePatients(text) {
        return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
          const [name = "", age = "", onc = "", odonto = "", confidence = "100", fastTrack = "nao"] = line.split(";").map((p) => p.trim());
          const parsedAge = age === "" ? null : Number(age);
          const parsedConfidence = Number(confidence);
          return {
            id: `${index}-${name || "paciente"}`,
            name: titleCaseName(name) || `Paciente ${index + 1}`,
            age: Number.isFinite(parsedAge) ? parsedAge : null,
            oncologico: isTruthyFlag(onc, ["onco", "oncologico", "oncológico"]),
            odonto: isTruthyFlag(odonto, ["odonto"]),
            fastTrack: isTruthyFlag(fastTrack, ["fasttrack", "fast track", "ft"]),
            confidence: Number.isFinite(parsedConfidence) ? parsedConfidence : 100,
          };
        });
      }
      function dedupePatients(patients) {
        const seen = new Set();
        return patients.filter((patient) => {
          const key = `${normalizeLoose(patient.name)}-${patient.age ?? ""}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      function distributePatients(patients, offices, startIndex = 0) {
        if (!offices.length) return { assigned: [], odonto: patients.filter((p) => p.odonto) };
        const activePatients = patients.filter((p) => !p.odonto);
        const odonto = patients.filter((p) => p.odonto);
        const assigned = activePatients.map((patient, idx) => ({ ...patient, consultorio: offices[(startIndex + idx) % offices.length] }));
        return { assigned, odonto };
      }
      function extractCandidateFromLine(line) {
        const normalized = normalizeText(line);
        const tokens = normalized.split(" ").filter(Boolean);
        const isDigitsOnly = (value) => value.length > 0 && value.split("").every((ch) => ch >= "0" && ch <= "9");
        const hasLetters = (value) => value.split("").some((ch) => isLatinLetter(ch));
        const firstToken = tokens[0] || "";
        const lastToken = tokens[tokens.length - 1] || "";
        const looksLikeHospitalLine = tokens.length >= 2 && ((isDigitsOnly(firstToken) && firstToken.length >= 3) || (isDigitsOnly(lastToken) && lastToken.length <= 2 && tokens.filter(hasLetters).length >= 2));
        if (looksLikeHospitalLine) {
          const work = [...tokens];
          if (work.length && isDigitsOnly(work[0]) && work[0].length >= 3) work.shift();
          while (work.length && ["A", "V", "DE", "YC", "VV"].includes(work[0].toUpperCase())) work.shift();
          while (work.length && isDigitsOnly(work[work.length - 1]) && work[work.length - 1].length <= 2) work.pop();
          const alphaTokens = work.filter((token) => hasLetters(token));
          if (alphaTokens.length >= 2) {
            const cleanedHospitalName = titleCaseName(alphaTokens.join(" "));
            if (cleanedHospitalName && cleanedHospitalName.length >= 6 && !nameLooksSuspicious(cleanedHospitalName)) return { name: cleanedHospitalName, age: null, odonto: false, oncologico: false, fastTrack: false };
          }
        }
        const ageMatch = normalized.match(/\b(1[01][0-9]|120|\d{1,2})\b/);
        if (!ageMatch) return null;
        const age = Number(ageMatch[1]);
        const withoutLeadingId = normalized.replace(/^\d{4,}\s*/, "");
        let cleanedName = withoutLeadingId.split(ageMatch[1])[0].trim();
        for (const word of ["FAST TRACK", "OUTROS", "ODONTOLOGIA", "CLINICA MEDICA", "CLINICA MÉDICA", "CLINICA", "MEDICA", "PACIENTE", "IDADE", "TEMPO", "ATENDIMENTO", "ESPECIALIDADE", "SETOR"]) {
          const idx = cleanedName.toUpperCase().indexOf(word);
          if (idx >= 0) cleanedName = cleanedName.slice(0, idx).trim();
        }
        cleanedName = titleCaseName(cleanedName);
        if (!cleanedName || cleanedName.length < 6) return null;
        const loose = normalizeLoose(normalized);
        return { name: cleanedName, age, odonto: loose.includes("ODONTOLOGIA"), oncologico: loose.includes("ONCO"), fastTrack: loose.includes("FAST TRACK") };
      }
      function parseHospitalScreenshotText(ocrText) {
        const patients = [];
        const lines = ocrText.split("\n").map(normalizeText).filter(Boolean).filter((line) => !line.toLowerCase().includes("hospital sao vicente")).filter((line) => !line.toLowerCase().includes("novo hospital"));
        for (const line of lines) {
          const candidate = extractCandidateFromLine(line);
          if (!candidate || nameLooksSuspicious(candidate.name)) continue;
          patients.push({ id: `${patients.length}-${candidate.name}`, name: candidate.name, age: candidate.age, oncologico: candidate.oncologico, odonto: candidate.odonto, fastTrack: candidate.fastTrack, confidence: 92 });
        }
        return dedupePatients(patients);
      }
      function groupConsensus(passResults) {
        const buckets = [];
        for (const result of passResults) {
          for (const patient of result) {
            const existing = buckets.find((bucket) => bucket.age === patient.age && levenshteinSimilarity(bucket.names[0], patient.name) >= 0.84);
            if (existing) {
              existing.names.push(patient.name); existing.votes += 1;
              existing.odonto ||= patient.odonto; existing.oncologico ||= patient.oncologico; existing.fastTrack ||= patient.fastTrack;
            } else {
              buckets.push({ age: patient.age, names: [patient.name], votes: 1, odonto: patient.odonto, oncologico: patient.oncologico, fastTrack: patient.fastTrack });
            }
          }
        }
        return buckets;
      }
      function chooseConsensusName(names) {
        let best = names[0] || "", bestScore = -1;
        for (const candidate of names) {
          const score = names.reduce((sum, current) => sum + levenshteinSimilarity(candidate, current), 0);
          if (score > bestScore) { bestScore = score; best = candidate; }
        }
        return titleCaseName(best);
      }
      function mergeMultiPassResults(passResults) {
        return groupConsensus(passResults).map((bucket, index) => {
          const name = chooseConsensusName(bucket.names);
          const confidence = Math.min(99, 70 + bucket.votes * 8 + Math.round(levenshteinSimilarity(name, bucket.names[0]) * 12));
          return { id: `${index}-${name}`, name, age: bucket.age, odonto: bucket.odonto, oncologico: bucket.oncologico, fastTrack: bucket.fastTrack, confidence };
        }).filter((patient) => !nameLooksSuspicious(patient.name));
      }
      function compareRemainingPatients(previousAssigned, currentDetected) {
        const stopwords = new Set(["DA", "DE", "DO", "DAS", "DOS", "E"]);
        const tokenize = (value) => normalizeLoose(value).split(" ").map((token) => token.trim()).filter(Boolean).filter((token) => token.length >= 3).filter((token) => !stopwords.has(token));
        const namesMatch = (basePatient, currentPatient) => {
          const base = normalizeLoose(basePatient.name);
          const cur = normalizeLoose(currentPatient.name);
          if (!base || !cur) return false;
          if (base === cur || base.includes(cur) || cur.includes(base)) return true;
          const similarity = levenshteinSimilarity(base, cur);
          const baseTokens = tokenize(basePatient.name);
          const curTokens = tokenize(currentPatient.name);
          const commonTokens = baseTokens.filter((token) => new Set(curTokens).has(token));
          const ageMatch = basePatient.age !== null && currentPatient.age !== null && basePatient.age === currentPatient.age;
          if (commonTokens.length >= 2 || (commonTokens.length >= 1 && ageMatch)) return true;
          if (baseTokens[0] && baseTokens[0] === curTokens[0] && baseTokens.at(-1) && baseTokens.at(-1) === curTokens.at(-1)) return true;
          if (baseTokens.at(-1) && baseTokens.at(-1) === curTokens.at(-1) && ageMatch) return true;
          return similarity >= 0.78 || (similarity >= 0.68 && ageMatch);
        };
        const matched = previousAssigned.filter((patient) => currentDetected.some((current) => namesMatch(patient, current))).map((patient) => ({ id: patient.id, name: patient.name, consultorio: patient.consultorio || "-" }));
        return { matched, debug: { baselineNames: previousAssigned.map((p) => `${p.name}${p.age !== null ? ` (${p.age})` : ""}`), detectedNames: currentDetected.map((p) => `${p.name}${p.age !== null ? ` (${p.age})` : ""}`), matchedNames: matched.map((p) => p.name) } };
      }

      function getComputedData() {
        const officeConfig = parseOfficeConfig(state.legendInput);
        const consultorios = officeConfig.filter((office) => office.active && office.name.trim()).map((office) => office.id);
        const legend = officeConfig.filter((office) => office.active && office.name.trim());
        const patients = dedupePatients(parsePatients(state.rawInput));
        const visiblePatients = patients.filter((patient) => state.includeFastTrack || !patient.fastTrack);
        const distributed = distributePatients(visiblePatients, consultorios, state.rotationStartIndex);
        const previewColumns = distributed.assigned.length <= 8 ? [distributed.assigned] : [distributed.assigned.slice(0, Math.ceil(distributed.assigned.length / 2)), distributed.assigned.slice(Math.ceil(distributed.assigned.length / 2))];
        return { officeConfig, consultorios, legend, patients, visiblePatients, assigned: distributed.assigned, odonto: distributed.odonto, previewColumns };
      }

      function moveLeftSection(id, direction) {
        const index = state.leftPanelOrder.indexOf(id);
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= state.leftPanelOrder.length) return;
        const next = [...state.leftPanelOrder];
        const [item] = next.splice(index, 1);
        next.splice(targetIndex, 0, item);
        state.leftPanelOrder = next;
        render();
      }

      function collapseButton(open, label, helper, onClickCode) {
        return `<button class="btn collapse" data-action="${onClickCode}"><span class="collapse-main">${open ? "⌄" : "›"} ${escapeHtml(label)}</span>${helper ? `<span class="collapse-helper">${escapeHtml(helper)}</span>` : ""}</button>`;
      }
      function moveButtons(id) {
        const index = state.leftPanelOrder.indexOf(id);
        return `<div class="move-buttons"><button class="btn" data-move="${id}:up" ${index <= 0 ? "disabled" : ""}>↑</button><button class="btn" data-move="${id}:down" ${index === state.leftPanelOrder.length - 1 ? "disabled" : ""}>↓</button></div>`;
      }

      function renderLeftSections(data) {
        const sections = state.leftPanelOrder.map((sectionId) => {
          if (sectionId === "legend") {
            const offices = data.officeConfig.map((office) => `
              <div class="office-row">
                <div class="office-id ${office.active ? "on" : "off"}" data-office-toggle="${office.id}">${office.id}</div>
                <input class="input office-name" data-office-name="${office.id}" value="${escapeHtml(office.name)}" placeholder="Nome ${office.id}" />
              </div>`).join("");
            return `<div class="section"><div class="section-head">${collapseButton(state.showLegend, "Configuração dos consultórios", "", "toggleLegend")}${moveButtons("legend")}</div>${state.showLegend ? `<div class="stack"><div class="hint">Ative e nomeie só os consultórios em uso.</div><div class="office-grid">${offices}</div></div>` : ""}</div>`;
          }
          if (sectionId === "upload") {
            return `<div class="section"><div class="section-head">${collapseButton(state.showUpload, "Enviar print", "", "toggleUpload")}${moveButtons("upload")}</div>${state.showUpload ? `
              <div id="dropzone" class="dropzone">
                <input id="mainFile" class="input" type="file" accept="image/*" />
                <div class="actions"><button class="btn" data-action="chooseMain">＋ Escolher imagem</button><div class="btn" style="cursor:default">▣ ${escapeHtml(state.pasteHint)}</div></div>
                <div class="status">${escapeHtml(state.ocrBusy ? "Processando imagem..." : state.ocrStatus)}</div>
                ${state.passSummary ? `<div class="status ok">${escapeHtml(state.passSummary)}</div>` : ""}
                <div class="status">Arraste a imagem aqui ou use o seletor acima.</div>
                ${state.uploadPreview ? `<img class="upload-preview" src="${safeImageSrc(state.uploadPreview)}" alt="Upload" />` : ""}
              </div>` : ""}</div>`;
          }
          return "";
        }).join("");
        setHtml("leftSections", sections);
      }

      function renderPreview(data) {
        $("rotateLabel").textContent = data.consultorios[state.rotationStartIndex] || "-";
        $("exportBtn").disabled = state.ocrBusy || !data.assigned.length;
        setHtml("legendPreview", data.legend.length ? data.legend.map((office) => `<div class="legend-item"><strong>${office.id}</strong><span>=</span><span>${escapeHtml(office.name)}</span></div>`).join("") : `<div class="status error">Ative consultórios na lateral</div>`);
        $("patientColumns").className = `patient-columns ${data.previewColumns.length > 1 ? "two" : ""}`;
        setHtml("patientColumns", data.previewColumns.map((columnPatients) => `<div class="patient-list">${columnPatients.map((patient) => `<div class="patient-row"><div class="patient-name">${escapeHtml(patient.name.toUpperCase())}</div><div class="room">${escapeHtml(patient.consultorio)}</div></div>`).join("")}</div>`).join(""));
        setHtml("odontoPreview", data.odonto.length ? `<div class="odonto"><div class="odonto-title">Odontologia</div><div class="stack" style="gap:6px">${data.odonto.map((patient) => `<div class="odonto-row"><span>${escapeHtml(patient.name)}</span><span style="color:var(--muted)">${escapeHtml(patient.age ?? "")}</span></div>`).join("")}</div></div>` : "");
        const confidenceCutoff = state.precisionMode ? 96 : 92;
        const flagged = [...data.assigned, ...data.odonto].filter((patient) => patient.confidence < confidenceCutoff || nameLooksSuspicious(patient.name));
        $("flagWarning").classList.toggle("hidden", !flagged.length);
      }

      function renderVerification() {
        const panel = $("verificationPanel");
        panel.classList.toggle("hidden", !state.verificationMode);
        if (!state.verificationMode) return;
        setHtml("verificationPanel", `
          <div style="font-size:13px;font-weight:900">Pacientes que continuam na imagem</div>
          <div class="hint">Envie a segunda imagem abaixo para cruzar com a base atual.</div>
          <input id="verificationFile" class="input" type="file" accept="image/*" />
          <div class="actions"><button class="btn" data-action="chooseVerification">+ Enviar segunda imagem</button><div class="btn" style="cursor:default">${state.verificationBusy ? "Verificando..." : "Pronto para conferir"}</div></div>
          ${state.verificationPreview ? `<img class="small-preview" src="${safeImageSrc(state.verificationPreview)}" alt="Verificacao" />` : ""}
          <div class="stack" style="gap:6px">${state.verificationResults.length ? state.verificationResults.map((item) => `<div class="verification-result"><div>${escapeHtml(item.name)}</div><div class="verification-room">${escapeHtml(item.consultorio)}</div></div>`).join("") : `<div class="hint">Nenhum paciente correspondente exibido ainda.</div>`}</div>
          <div style="border-top:1px solid var(--line);padding-top:8px;display:grid;gap:6px">
            <div style="font-size:12px;font-weight:900">Debug da verificação</div>
            <div class="hint">Base:</div><div style="font-size:12px">${escapeHtml(state.verificationDebug.baselineNames.join(" | ") || "-")}</div>
            <div class="hint">Nova imagem:</div><div style="font-size:12px">${escapeHtml(state.verificationDebug.detectedNames.join(" | ") || "-")}</div>
            <div class="hint">Casados:</div><div style="font-size:12px">${escapeHtml(state.verificationDebug.matchedNames.join(" | ") || "-")}</div>
          </div>`);
      }

      function renderReadingSummary() {
        const box = $("readingSummary");
        box.classList.toggle("hidden", !state.ocrLog);
        setHtml("readingSummary", state.ocrLog ? `${collapseButton(state.showReadingSummary, "Resumo das leituras", "Abrir / fechar", "toggleReading")}${state.showReadingSummary ? `<textarea id="ocrLog" class="input" rows="7">${escapeHtml(state.ocrLog)}</textarea>` : ""}` : "");
      }

      function renderTop() {
        $("precisionBtn").classList.toggle("off", !state.precisionMode);
        $("fastTrackBtn").classList.toggle("off", !state.includeFastTrack);
        $("verificationBtn").classList.toggle("off", !state.verificationMode);
        $("downloadLink").classList.toggle("hidden", !state.generatedImageDataUrl);
        $("copyBtn").classList.toggle("hidden", !state.generatedImageDataUrl);
        $("downloadLink").href = state.generatedImageDataUrl || "#";
      }

      function render() {
        const data = getComputedData();
        renderTop();
        renderLeftSections(data);
        renderPreview(data);
        renderVerification();
        renderReadingSummary();
        attachDynamicListeners();
      }

      function refreshComputedView() {
        const data = getComputedData();
        renderTop();
        renderPreview(data);
      }

      function attachDynamicListeners() {
        document.querySelectorAll("[data-action]").forEach((el) => {
          el.onclick = () => runAction(el.dataset.action);
        });
        document.querySelectorAll("[data-move]").forEach((el) => {
          el.onclick = () => {
            const [id, direction] = el.dataset.move.split(":");
            moveLeftSection(id, direction);
          };
        });
        document.querySelectorAll("[data-office-toggle]").forEach((el) => {
          el.onclick = () => {
            const data = getComputedData();
            const next = data.officeConfig.map((item) => item.id === el.dataset.officeToggle ? { ...item, active: !item.active } : item);
            state.legendInput = serializeOfficeConfig(next);
            render();
          };
        });
        document.querySelectorAll("[data-office-name]").forEach((el) => {
          el.oninput = () => {
            const data = getComputedData();
            const next = data.officeConfig.map((item) => item.id === el.dataset.officeName ? { ...item, name: el.value, active: el.value.trim() ? true : item.active } : item);
            state.legendInput = serializeOfficeConfig(next);
            const officeRow = el.closest(".office-row");
            const officeId = officeRow?.querySelector(".office-id");
            if (officeId) {
              officeId.classList.toggle("on", Boolean(el.value.trim()));
              officeId.classList.toggle("off", !el.value.trim());
            }
            refreshComputedView();
          };
        });
        const rawInput = $("rawInput");
        if (rawInput) rawInput.oninput = () => { state.rawInput = rawInput.value; state.generatedImageDataUrl = ""; refreshComputedView(); };
        const ocrLog = $("ocrLog");
        if (ocrLog) ocrLog.oninput = () => { state.ocrLog = ocrLog.value; };
        const mainFile = $("mainFile");
        if (mainFile) mainFile.onchange = () => processImageFile(mainFile.files && mainFile.files[0]);
        const verificationFile = $("verificationFile");
        if (verificationFile) verificationFile.onchange = () => processVerificationImageFile(verificationFile.files && verificationFile.files[0]);
        const dropzone = $("dropzone");
        if (dropzone) {
          dropzone.ondragover = (event) => { event.preventDefault(); dropzone.classList.add("drag"); };
          dropzone.ondragleave = (event) => { event.preventDefault(); dropzone.classList.remove("drag"); };
          dropzone.ondrop = (event) => { event.preventDefault(); dropzone.classList.remove("drag"); processImageFile(event.dataTransfer.files && event.dataTransfer.files[0]); };
        }
      }

      function runAction(action) {
        if (action === "toggleLegend") state.showLegend = !state.showLegend;
        if (action === "toggleUpload") state.showUpload = !state.showUpload;
        if (action === "toggleExtracted") state.showExtractedPatients = !state.showExtractedPatients;
        if (action === "toggleReading") state.showReadingSummary = !state.showReadingSummary;
        if (action === "chooseMain") { state.pasteTarget = "main"; $("mainFile")?.click(); return; }
        if (action === "chooseVerification") { state.pasteTarget = "verification"; $("verificationFile")?.click(); return; }
        render();
      }

      function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
          reader.readAsDataURL(file);
        });
      }
      function loadImageFromDataURL(dataUrl) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Falha ao abrir imagem."));
          img.src = dataUrl;
        });
      }
      function preprocessImage(img, options) {
        const { scale = 1, grayscale = false, contrast = 1, threshold = null } = options;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return canvas;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i], g = data[i + 1], b = data[i + 2];
          if (grayscale) { const gray = 0.299 * r + 0.587 * g + 0.114 * b; r = gray; g = gray; b = gray; }
          r = (r - 128) * contrast + 128; g = (g - 128) * contrast + 128; b = (b - 128) * contrast + 128;
          if (threshold !== null) { const val = (r + g + b) / 3 > threshold ? 255 : 0; r = val; g = val; b = val; }
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
      async function runOcrPass(imageSource, config, onStatus) {
        if (!window.Tesseract) throw new Error("Tesseract nao carregou. Reabra o app ou use entrada manual.");
        const result = await Tesseract.recognize(imageSource, "por+eng", {
          workerPath: appAssetUrl("vendor/worker.min.js"),
          corePath: appAssetUrl("vendor/tesseract-core"),
          langPath: appAssetUrl("vendor/tessdata"),
          workerBlobURL: false,
          logger: (message) => {
            if (message.status === "recognizing text") onStatus(`${config.label}: ${Math.round((message.progress || 0) * 100)}%`);
          },
        });
        return parseHospitalScreenshotText(result.data.text || "");
      }
      async function extractPatientsFromFile(file, setStatus) {
        if (!file || !file.type.startsWith("image/")) throw new Error("O arquivo precisa ser uma imagem valida.");
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImageFromDataURL(dataUrl);
        const passes = state.precisionMode ? OCR_PASSES : OCR_PASSES.slice(0, 2);
        const passResults = [];
        const logLines = [];
        for (const pass of passes) {
          setStatus(`Executando leitura ${pass.label}...`);
          const source = preprocessImage(img, pass);
          const patientsFromPass = await runOcrPass(source, pass, (message) => setStatus(`Leitura ${message}`));
          passResults.push(patientsFromPass);
          logLines.push(`${pass.label}: ${patientsFromPass.map((p) => `${p.name} (${p.age ?? "?"})`).join(" | ") || "sem pacientes"}`);
        }
        let extractedPatients = mergeMultiPassResults(passResults).filter((patient) => !nameLooksSuspicious(patient.name));
        extractedPatients = dedupePatients(extractedPatients);
        return { dataUrl, extractedPatients, logLines, passesCount: passes.length };
      }
      async function processImageFile(file) {
        if (!file || !file.type.startsWith("image/")) { state.ocrStatus = "O arquivo precisa ser uma imagem valida."; render(); return; }
        state.ocrBusy = true; state.generatedImageDataUrl = ""; state.passSummary = ""; state.ocrStatus = "Preparando imagem..."; render();
        try {
          const { dataUrl, extractedPatients, logLines, passesCount } = await extractPatientsFromFile(file, (value) => { state.ocrStatus = value; render(); });
          state.uploadPreview = dataUrl;
          if (!extractedPatients.length) {
            state.ocrLog = logLines.join("\n\n");
            state.ocrStatus = "Nao consegui montar pacientes com seguranca. Tente outra imagem ou ajuste manualmente.";
            return;
          }
          state.rawInput = extractedPatients.map((patient) => `${patient.name};${patient.age ?? ""};${patient.oncologico ? "sim" : "nao"};${patient.odonto ? "sim" : "nao"};${patient.confidence};${patient.fastTrack ? "sim" : "nao"}`).join("\n");
          state.passSummary = `${passesCount} leituras combinadas por consenso.`;
          state.ocrLog = logLines.join("\n\n");
          state.ocrStatus = `${extractedPatients.length} pacientes encontrados. Revise os nomes e depois gere o PNG.`;
        } catch (error) {
          state.ocrStatus = error instanceof Error ? error.message : "Falha ao abrir imagem.";
        } finally {
          state.ocrBusy = false; render();
        }
      }
      async function processVerificationImageFile(file) {
        if (!state.verificationBase.length) { state.ocrStatus = "Primeiro ative a verificacao com uma base carregada."; render(); return; }
        state.verificationBusy = true; render();
        try {
          const { dataUrl, extractedPatients, logLines } = await extractPatientsFromFile(file, (value) => { state.ocrStatus = value; render(); });
          state.verificationPreview = dataUrl;
          const verification = compareRemainingPatients(state.verificationBase, extractedPatients);
          state.verificationResults = verification.matched;
          state.verificationDebug = {
            baselineNames: state.verificationBase.map((p) => `${p.name}${p.age !== null ? ` (${p.age})` : ""}`),
            detectedNames: extractedPatients.map((p) => `${p.name}${p.age !== null ? ` (${p.age})` : ""}`),
            matchedNames: verification.debug.matchedNames,
          };
          state.ocrLog = logLines.join("\n\n");
          state.ocrStatus = verification.matched.length ? `${verification.matched.length} pacientes continuam na nova imagem.` : "Nenhum paciente da base foi encontrado na nova imagem.";
        } catch (error) {
          state.ocrStatus = error instanceof Error ? error.message : "Falha ao verificar imagem.";
        } finally {
          state.verificationBusy = false; render();
        }
      }

      $("closeAllBtn").onclick = () => { state.showLegend = false; state.showUpload = false; state.showExtractedPatients = false; state.showReadingSummary = false; render(); };
      $("rotateBtn").onclick = () => { const data = getComputedData(); state.rotationStartIndex = data.consultorios.length ? (state.rotationStartIndex + 1) % data.consultorios.length : 0; render(); };
      $("precisionBtn").onclick = () => { state.precisionMode = !state.precisionMode; render(); };
      $("fastTrackBtn").onclick = () => { state.includeFastTrack = !state.includeFastTrack; render(); };
      $("verificationBtn").onclick = () => {
        const data = getComputedData();
        state.verificationMode = !state.verificationMode;
        state.verificationResults = []; state.verificationPreview = "";
        if (state.verificationMode) {
          state.verificationBase = data.assigned.length ? data.assigned.map((patient) => ({ ...patient })) : [];
          state.pasteTarget = state.verificationBase.length ? "verification" : "main";
          state.verificationDebug = { baselineNames: state.verificationBase.map((p) => `${p.name}${p.age !== null ? ` (${p.age})` : ""}`), detectedNames: [], matchedNames: [] };
          state.ocrStatus = state.verificationBase.length ? `Verificacao ligada. Base congelada com ${state.verificationBase.length} pacientes.` : "Carregue pacientes antes de ativar a verificacao.";
        } else {
          state.verificationBase = []; state.pasteTarget = "main"; state.verificationDebug = { baselineNames: [], detectedNames: [], matchedNames: [] };
        }
        render();
      };
      $("clearBtn").onclick = () => {
        Object.assign(state, { rawInput: "", uploadPreview: "", generatedImageDataUrl: "", ocrLog: "", verificationResults: [], verificationPreview: "", verificationDebug: { baselineNames: [], detectedNames: [], matchedNames: [] }, verificationBase: [], pasteTarget: "main", ocrStatus: "Lista limpa." });
        render();
        showToast("Lista limpa");
      };
      $("exportBtn").onclick = async () => {
        const data = getComputedData();
        if (!data.assigned.length) {
          $("exportError").textContent = "Nao ha pacientes suficientes para gerar o PNG.";
          $("exportError").classList.remove("hidden");
          showToast("Sem pacientes para gerar PNG");
          return;
        }
        $("exportError").classList.add("hidden");
        try {
          if (!window.html2canvas) throw new Error("html2canvas nao carregou. Reabra o app.");
          const target = $("preview");
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const rect = target.getBoundingClientRect();
          const canvas = await html2canvas(target, { backgroundColor: "#f4f7fb", scale: 2, useCORS: true, allowTaint: true, logging: false, width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
          state.generatedImageDataUrl = canvas.toDataURL("image/png");
          render();
          showToast("PNG gerado");
        } catch (error) {
          $("exportError").textContent = error instanceof Error ? error.message : "Falha ao gerar o PNG.";
          $("exportError").classList.remove("hidden");
          showToast("Falha ao gerar PNG");
        }
      };
      $("copyBtn").onclick = async () => {
        if (!state.generatedImageDataUrl) return;
        try {
          const blob = await (await fetch(state.generatedImageDataUrl)).blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          state.ocrStatus = "PNG copiado.";
          showToast("PNG copiado");
        } catch {
          state.ocrStatus = "Copia bloqueada pelo navegador. Use o botao Baixar PNG.";
          showToast("Copia bloqueada");
        }
        render();
      };
      $("downloadLink").onclick = () => {
        showToast("Download iniciado");
      };
      window.addEventListener("paste", async (event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (!imageItem) return;
        const file = imageItem.getAsFile();
        if (!file) return;
        event.preventDefault();
        if (state.verificationMode && state.pasteTarget === "verification") {
          state.ocrStatus = "Segunda imagem colada com Ctrl+V.";
          await processVerificationImageFile(file);
          return;
        }
        state.pasteHint = "Print colado com Ctrl+V.";
        await processImageFile(file);
      });

      render();
