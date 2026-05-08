var input = document.getElementById("input");
var output = document.getElementById("output");

document.getElementById("campoLimpoBtn").onclick = function () {
  output.textContent = transcribeCampoLimpoLabs(input.value);
};

document.getElementById("jundiaiBtn").onclick = function () {
  output.textContent = transcribeJundiaiLabs(input.value);
};

document.getElementById("copyBtn").onclick = function () {
  var text = output.textContent || "";
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
  else {
    var area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }
};

document.getElementById("clearBtn").onclick = function () {
  input.value = "";
  output.textContent = "Cole o exame ao lado e clique em Transcrever exames.";
  input.focus();
};

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    output.textContent = transcribeCampoLimpoLabs(input.value);
  }
});
