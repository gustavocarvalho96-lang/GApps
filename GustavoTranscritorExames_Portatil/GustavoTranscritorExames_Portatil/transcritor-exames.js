var input = document.getElementById("input");
var output = document.getElementById("output");
var campoLimpoBtn = document.getElementById("campoLimpoBtn");
var jundiaiBtn = document.getElementById("jundiaiBtn");
var activeSource = "campo-limpo";

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
  campoLimpoBtn.classList.toggle("active", activeSource === "campo-limpo");
  jundiaiBtn.classList.toggle("active", activeSource === "jundiai");
}

function transcribeBySource(source) {
  activeSource = source || activeSource;
  updateSourceButtons();
  if (activeSource === "jundiai") {
    output.textContent = transcribeJundiaiLabs(input.value);
    showToast("Transcrito: Jundiai");
    return;
  }
  output.textContent = transcribeCampoLimpoLabs(input.value);
  showToast("Transcrito: Campo Limpo");
}

campoLimpoBtn.onclick = function () {
  transcribeBySource("campo-limpo");
};

jundiaiBtn.onclick = function () {
  transcribeBySource("jundiai");
};

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
  output.textContent = "Cole o exame ao lado e clique em Transcrever exames.";
  input.focus();
  showToast("Campos limpos");
};

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    transcribeBySource(activeSource);
  }
});

updateSourceButtons();
