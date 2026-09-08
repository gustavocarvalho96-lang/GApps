import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { handleRequest, HMA_INSTRUCTIONS } from "../cloudflare/hma-api/src/index.mjs";

const origin = "https://gustavocarvalho96-lang.github.io";
const env = {
  ALLOWED_ORIGIN: origin,
  OPENAI_API_KEY: "openai-test",
  APP_TOKEN: "app-test",
  OPENAI_MODEL: "modelo-teste",
  HMA_RATE_LIMITER: { async limit() { return { success: true }; } }
};

function hmaRequest(text, overrides = {}) {
  const method = overrides.method || "POST";
  return new Request("https://worker.example/api/hma", {
    method,
    headers: {
      Origin: overrides.origin || origin,
      Authorization: overrides.authorization || "Bearer app-test",
      "Content-Type": overrides.contentType || "application/json"
    },
    body: method === "POST" ? JSON.stringify({ text }) : undefined
  });
}

test("Worker envia somente a HMA e desativa armazenamento", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer openai-test");
    const payload = JSON.parse(options.body);
    assert.equal(payload.model, "modelo-teste");
    assert.equal(payload.input, "tosse há 3 dias");
    assert.equal(payload.store, false);
    assert.equal(payload.instructions, HMA_INSTRUCTIONS);
    assert.equal(payload.text.format.type, "json_schema");
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ text: "Refere tosse há três dias.", alarm_signs: ["dispneia", "dor torácica"] }) }] }] });
  };
  const response = await handleRequest(hmaRequest(" tosse há 3 dias "), env, fetchImpl);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "Refere tosse há três dias.", alarmSigns: ["dispneia", "dor torácica"] });
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
});

test("Worker bloqueia origem, código e excesso de chamadas", async () => {
  assert.equal((await handleRequest(hmaRequest("texto", { origin: "https://example.com" }), env)).status, 403);
  assert.equal((await handleRequest(hmaRequest("texto", { authorization: "Bearer incorreto" }), env)).status, 401);
  const limitedEnv = { ...env, HMA_RATE_LIMITER: { async limit() { return { success: false }; } } };
  assert.equal((await handleRequest(hmaRequest("texto"), limitedEnv)).status, 429);
});

test("Worker valida conteúdo, tamanho e preflight", async () => {
  assert.equal((await handleRequest(hmaRequest(""), env)).status, 400);
  assert.equal((await handleRequest(hmaRequest("x".repeat(12001)), env)).status, 413);
  const request = new Request("https://worker.example/api/hma", { method: "OPTIONS", headers: { Origin: origin } });
  assert.equal((await handleRequest(request, env)).status, 204);
});

test("Interface extrai apenas HMA e exige aplicação manual", async () => {
  const make = () => {
    const node = { children: [], hidden: false, appendChild(child) { this.children.push(child); }, setAttribute() {} };
    Object.defineProperty(node, "innerHTML", { set() { node.children = []; } });
    return node;
  };
  const source = "# HMA : tosse\n# AP : asma";
  const area = { value: source, isConnected: true };
  const storage = new Map([["token", "app-test"]]);
  let sent;
  let saved = 0;
  const context = vm.createContext({
    div: make, document: { createElement: make }, AbortSignal,
    window: { GPLANTAO_HMA_API: { url: "https://worker.example/api/hma", tokenStorageKey: "token" }, prompt() { return null; } },
    localStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); } },
    state: { editableText: source }, saveAnamneseDraft() { saved++; },
    textButton(label, cls, action) { return { ...make(), label, action }; },
    async fetch(url, options) { sent = { url, options }; return Response.json({ text: "Refere tosse.", alarmSigns: ["dispneia"] }); }
  });
  vm.runInContext(await readFile(new URL("../Apps/GPlantao/plantao-hma-ia.js", import.meta.url), "utf8"), context);
  const body = make();
  context.mountHmaAi(area, body);
  const [actions, status, preview, preferencesBox, alarmBox] = body.children[0].children;
  const [revise, preferencesButton, apply] = actions.children;
  await revise.action();
  assert.equal(sent.url, "https://worker.example/api/hma");
  assert.equal(sent.options.headers.Authorization, "Bearer app-test");
  assert.deepEqual(JSON.parse(sent.options.body), { text: "tosse", preferences: "" });
  preferencesButton.action();
  assert.equal(preferencesBox.hidden, false);
  assert.equal(area.value, source);
  area.value += " alterada";
  apply.action();
  assert.equal(saved, 0);
  assert.match(status.textContent, /mudou/);
  area.value = source;
  await revise.action();
  assert.equal(preview.value, "Refere tosse.");
  assert.equal(alarmBox.hidden, false);
  alarmBox.children[2].children[0].children[0].checked = true;
  apply.action();
  assert.equal(area.value, "# HMA : Refere tosse. Nega dispneia.\n# AP : asma");
  assert.equal(saved, 1);
});

test("Interface acrescenta somente negativas confirmadas", async () => {
  const context = {};
  vm.runInNewContext(await readFile(new URL("../Apps/GPlantao/plantao-hma-ia.js", import.meta.url), "utf8"), context);
  assert.equal(context.appendConfirmedHmaNegatives("Refere cefaleia", []), "Refere cefaleia");
  assert.equal(context.appendConfirmedHmaNegatives("Refere cefaleia", ["déficit focal", "síncope"]), "Refere cefaleia. Nega déficit focal e síncope.");
});
