import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { createHmaServer } from "../Apps/GPlantao/server.mjs";
import { improveHma } from "../Apps/GPlantao/hma-api.mjs";

test("HMA: extrai somente a seção e preserva as demais ao aplicar", async () => {
  const context = vm.createContext({});
  vm.runInContext(await readFile(new URL("../Apps/GPlantao/plantao-hma-ia.js", import.meta.url), "utf8"), context);
  for (const newline of ["\n", "\r\n"]) {
    const text = ["# HMA : tosse há 3 dias", "nega febre", "# AP : asma", "# MUC : medicação", "# Alergia : dipirona"].join(newline);
    const section = context.findHmaSection(text);
    assert.equal(section.text, "tosse há 3 dias" + newline + "nega febre");
    assert.equal(text.slice(0, section.start) + "Revisão" + text.slice(section.end), ["# HMA : Revisão", "# AP : asma", "# MUC : medicação", "# Alergia : dipirona"].join(newline));
  }
  assert.equal(context.findHmaSection("# HMA :\n# AP : asma").text, "");
  assert.equal(context.findHmaSection("# AP : asma"), null);
});

test("Responses: envia texto sem armazenamento e rejeita resposta incompleta", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(options.body);
    assert.equal(body.input, "tosse, nega febre");
    assert.equal(body.store, false);
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Refere tosse. Nega febre." }] }] });
  };
  assert.equal(await improveHma("tosse, nega febre", { apiKey: "fake", model: "test", fetchImpl }), "Refere tosse. Nega febre.");
  await assert.rejects(improveHma("texto", { apiKey: "fake", model: "test", fetchImpl: async () => Response.json({ status: "incomplete", output: [] }) }), /não foi concluída/);
  await assert.rejects(improveHma("texto", { apiKey: "fake", model: "test", fetchImpl: async () => new Response("", { status: 429 }) }), /Limite/);
});

test("Servidor: revisão, validação, origem e proteção de arquivos", async t => {
  let calls = 0;
  const server = createHmaServer({ apiKey: "fake", revise: async text => { calls++; return "Revisado: " + text; } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (text, from = origin) => fetch(origin + "/api/hma", { method: "POST", headers: { Origin: from, "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  assert.equal((await fetch(origin + "/GPlantao.html")).status, 200);
  assert.equal((await fetch(origin + "/Apps/GPlantao/server.mjs")).status, 404);
  assert.equal((await fetch(origin + "/.git/config")).status, 404);
  assert.equal((await post("tosse", "https://example.com")).status, 403);
  assert.equal((await post("")).status, 400);
  assert.equal((await post("x".repeat(12001))).status, 400);
  assert.deepEqual(await (await post("náusea há 2 dias")).json(), { text: "Revisado: náusea há 2 dias" });
  assert.equal(calls, 1);
});

test("Servidor sem chave informa como ativar", async t => {
  const server = createHmaServer({ apiKey: "" });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(origin + "/api/hma", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ text: "tosse" }) });
  assert.equal(response.status, 503);
});

test("Interface: revisão exige aplicação e bloqueia sobrescrever edição posterior", async () => {
  const make = () => ({ children: [], hidden: false, appendChild(child) { this.children.push(child); }, setAttribute() {} });
  const source = "# HMA : tosse\n# AP : asma";
  const area = { value: source, isConnected: true };
  let sent;
  let saved = 0;
  const context = vm.createContext({
    div: make, document: { createElement: make }, location: { protocol: "http:" }, AbortSignal,
    state: { editableText: source }, saveAnamneseDraft() { saved++; },
    textButton(label, cls, action) { return { ...make(), label, action }; },
    async fetch(url, options) { sent = JSON.parse(options.body); return Response.json({ text: "Refere tosse." }); }
  });
  vm.runInContext(await readFile(new URL("../Apps/GPlantao/plantao-hma-ia.js", import.meta.url), "utf8"), context);
  const body = make();
  context.mountHmaAi(area, body);
  const [actions, status, preview] = body.children[0].children;
  const [revise, apply] = actions.children;
  await revise.action();
  assert.deepEqual(sent, { text: "tosse" });
  assert.equal(area.value, source);
  assert.equal(preview.value, "Refere tosse.");
  area.value += " nova edição";
  apply.action();
  assert.equal(saved, 0);
  assert.match(status.textContent, /mudou/);
  area.value = source;
  await revise.action();
  apply.action();
  assert.equal(area.value, "# HMA : Refere tosse.\n# AP : asma");
  assert.equal(saved, 1);
});
