var input = document.getElementById("input");
var output = document.getElementById("output");

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

document.getElementById("campoLimpoBtn").onclick = function () {
  output.textContent = transcribeCampoLimpoLabs(input.value);
  showToast("Transcrito: Campo Limpo");
};

document.getElementById("jundiaiBtn").onclick = function () {
  output.textContent = transcribeJundiaiLabs(input.value);
  showToast("Transcrito: Jundiai");
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
    output.textContent = transcribeCampoLimpoLabs(input.value);
    showToast("Transcrito: Campo Limpo");
  }
});
