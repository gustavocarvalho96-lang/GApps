var input = document.getElementById("input");
var output = document.getElementById("output");
var autoBtn = document.getElementById("autoBtn");
var campoLimpoBtn = document.getElementById("campoLimpoBtn");
var jundiaiBtn = document.getElementById("jundiaiBtn");
var detectedSource = document.getElementById("detectedSource");
var activeSource = "auto";
var autoTranscribeTimer;
var emptyMessage = "Cole o exame ao lado para transcrever automaticamente.";

function showToast(message) {
  var toast = document.getElementById("actionToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "actionToast";
    toast.className = "action-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 1600);
}

function updateSourceButtons() {
  autoBtn.classList.toggle("active", activeSource === "auto");
  campoLimpoBtn.classList.toggle("active", activeSource === "campo-limpo");
  jundiaiBtn.classList.toggle("active", activeSource === "jundiai");
}

function setDetectedSource(label) {
  detectedSource.textContent = "Origem: " + label;
}

function resetTranscription() {
  output.textContent = emptyMessage;
  setDetectedSource("Aguardando exame");
}

function transcribeBySource(source, options) {
  options = options || {};
  activeSource = source || activeSource;
  updateSourceButtons();
  if (!input.value.trim()) {
    resetTranscription();
    return;
  }
  if (activeSource === "auto") {
    var result = transcribeAutomaticLabs(input.value);
    output.textContent = result.output;
    setDetectedSource(result.label);
    if (options.toast) showToast("Transcrito: " + result.label);
    return;
  }
  if (activeSource === "jundiai") {
    output.textContent = transcribeJundiaiLabs(input.value);
    setDetectedSource("Jundiai");
    if (options.toast) showToast("Transcrito: Jundiai");
    return;
  }
  output.textContent = transcribeCampoLimpoLabs(input.value);
  setDetectedSource("Campo Limpo");
  if (options.toast) showToast("Transcrito: Campo Limpo");
}

function scheduleAutoTranscription() {
  clearTimeout(autoTranscribeTimer);
  autoTranscribeTimer = setTimeout(function () {
    transcribeBySource(activeSource);
  }, 180);
}

autoBtn.onclick = function () {
  transcribeBySource("auto", { toast: true });
};

campoLimpoBtn.onclick = function () {
  transcribeBySource("campo-limpo", { toast: true });
};

jundiaiBtn.onclick = function () {
  transcribeBySource("jundiai", { toast: true });
};

input.addEventListener("input", scheduleAutoTranscription);

document.getElementById("copyBtn").onclick = function () {
  var text = output.textContent || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showToast("Resultado copiado");
    }).catch(function () {
      showToast("Nao foi possivel copiar");
    });
  }
  else {
    var area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
    showToast("Resultado copiado");
  }
};

document.getElementById("clearBtn").onclick = function () {
  input.value = "";
  resetTranscription();
  input.focus();
  showToast("Campos limpos");
};

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    transcribeBySource(activeSource, { toast: true });
  }
});

updateSourceButtons();
resetTranscription();
