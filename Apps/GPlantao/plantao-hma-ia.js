function findHmaSection(text) {
  var marker = /^[ \t]*#?[ \t]*HMA[ \t]*:[ \t]*/im.exec(text);
  if (!marker) return null;
  var start = marker.index + marker[0].length;
  var remaining = text.slice(start);
  var next = /(?:^|\r?\n)[ \t]*(?:#|(?:AP|MUC|Alergia|Exame f[ií]sico|Conduta)[ \t]*:)/im.exec(remaining);
  var end = next ? start + next.index : text.length;
  return { start: start, end: end, text: text.slice(start, end).trim() };
}

function mountHmaAi(area, body) {
  var panel = div("panel stack hma-ai-panel");
  var actions = div("row");
  var status = div("hma-ai-status");
  status.setAttribute("role", "status");
  status.textContent = "Ao revisar, somente o texto da HMA será enviado à OpenAI. Remova identificadores do paciente antes de enviar.";
  var preview = document.createElement("textarea");
  preview.setAttribute("aria-label", "HMA revisada pela IA");
  preview.rows = 6;
  preview.hidden = true;
  var original = null;
  var apply = textButton("Aplicar na HMA", "text-btn", function () {
    if (area.value !== original) {
      status.textContent = "A anamnese mudou desde a revisão. Revise novamente para aplicar com segurança.";
      apply.hidden = true;
      return;
    }
    var section = findHmaSection(area.value);
    if (!section || !preview.value.trim()) return;
    area.value = area.value.slice(0, section.start) + preview.value.trim() + area.value.slice(section.end);
    state.editableText = area.value;
    saveAnamneseDraft("HMA revisada salva");
    preview.hidden = true;
    apply.hidden = true;
    discard.hidden = true;
    status.textContent = "HMA atualizada.";
  });
  apply.hidden = true;
  var discard = textButton("Descartar sugestão", "text-btn", function () {
    preview.value = "";
    preview.hidden = apply.hidden = discard.hidden = true;
    status.textContent = "Sugestão descartada.";
  });
  discard.hidden = true;
  var revise = textButton("Melhorar HMA com IA", "text-btn", async function () {
    var section = findHmaSection(area.value);
    if (!section || !section.text) { status.textContent = "Escreva o texto após HMA: antes de revisar."; return; }
    if (section.text.length > 12000) { status.textContent = "Use até 12.000 caracteres na HMA."; return; }
    var config = window.GPLANTAO_HMA_API || {};
    var apiUrl = typeof config.url === "string" ? config.url.trim() : "";
    if (!apiUrl) { status.textContent = "O servidor online da IA ainda não foi configurado."; return; }
    var tokenKey = config.tokenStorageKey || "gplantao-hma-api-token-v1";
    var accessToken = localStorage.getItem(tokenKey);
    if (!accessToken) {
      accessToken = window.prompt("Digite o código de acesso da IA. Ele será solicitado apenas uma vez neste navegador:");
      if (!accessToken || !accessToken.trim()) { status.textContent = "Revisão cancelada."; return; }
      accessToken = accessToken.trim();
      localStorage.setItem(tokenKey, accessToken);
    }
    original = area.value;
    preview.hidden = apply.hidden = discard.hidden = true;
    revise.disabled = true;
    status.textContent = "Revisando a redação da HMA…";
    try {
      var response = await fetch(apiUrl, { method: "POST", headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" }, body: JSON.stringify({ text: section.text }), signal: AbortSignal.timeout(55000) });
      if (!(response.headers.get("content-type") || "").includes("application/json")) throw new Error("O servidor da IA retornou uma resposta inválida.");
      var result = await response.json();
      if (response.status === 401) localStorage.removeItem(tokenKey);
      if (!response.ok) throw new Error(result.error || "Não foi possível revisar a HMA.");
      if (typeof result.text !== "string" || !result.text.trim()) throw new Error("A API não retornou uma revisão válida.");
      if (!area.isConnected) return;
      preview.value = result.text;
      preview.hidden = apply.hidden = discard.hidden = false;
      status.textContent = "Confira a redação. Os sinais de alarme foram incluídos; retire manualmente os que não forem pertinentes antes de aplicar.";
    } catch (error) {
      status.textContent = error.name === "TimeoutError" ? "A revisão demorou demais. Tente novamente." : error.message === "Failed to fetch" ? "Não foi possível conectar ao servidor de IA." : error.message;
    } finally { revise.disabled = false; }
  });
  actions.appendChild(revise);
  actions.appendChild(apply);
  actions.appendChild(discard);
  panel.appendChild(actions);
  panel.appendChild(status);
  panel.appendChild(preview);
  body.appendChild(panel);
}
