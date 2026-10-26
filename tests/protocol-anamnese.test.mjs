import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { handleRequest, PROTOCOL_INSTRUCTIONS, REASSESSMENT_INSTRUCTIONS, validateProtocolPayload, validateReassessmentPayload } from "../cloudflare/hma-api/src/index.mjs";

const context = vm.createContext({ window: {} });
for (const file of ["plantao-protocolo-form-core.js", "plantao-protocolos-data.js"]) {
  vm.runInContext(await readFile(new URL("../Apps/GPlantao/" + file, import.meta.url), "utf8"), context);
}
const core = context.window.ClinicalFormCore;
const protocol = context.clinicalProtocols[1];
const groups = core.schema(protocol.prescription);
const fields = groups.flatMap(group => group.fields);
const field = label => fields.find(item => item.label === label);
const plain = value => JSON.parse(JSON.stringify(value));

test("formulário não envia campos vazios nem negativas presumidas", () => {
  assert.deepEqual(plain(core.collect(groups, {})), []);
  const answers = {
    [field("Característica").id]: { selected: ["aperto"], text: "há 2 horas" },
    [field("Dispneia").id]: { selected: ["Negado"], text: "" },
    [field("Síncope").id]: { selected: ["Desconhecido"] }
  };
  const data = plain(core.collect(groups, answers));
  const json = JSON.stringify(data);
  assert.match(json, /aperto — há 2 horas/);
  assert.match(json, /Negado/);
  assert.match(json, /Desconhecido/);
  assert.doesNotMatch(json, /Sudorese|Hemoptise|não investigado/);
});

test("cliques permitem múltiplas características e irradiação exclusiva", () => {
  const character = field("Característica"), radiation = field("Irradiação");
  assert.deepEqual(plain(core.toggle(character, ["aperto"], "peso")), ["aperto", "peso"]);
  assert.deepEqual(plain(core.toggle(character, ["aperto"], "aperto")), []);
  assert.deepEqual(plain(core.toggle(radiation, ["braço esquerdo"], "sem irradiação")), ["sem irradiação"]);
  assert.deepEqual(plain(core.toggle(radiation, ["sem irradiação"], "mandíbula")), ["mandíbula"]);
});

test("HEART só soma quando os cinco componentes foram explicitamente preenchidos", () => {
  const components = fields.filter(item => item.heart);
  assert.equal(components.length, 5);
  const answers = {};
  components.slice(0, 4).forEach(item => answers[item.id] = { selected: ["0"] });
  assert.doesNotMatch(JSON.stringify(core.collect(groups, answers)), /total informado/);
  answers[components[4].id] = { selected: ["2"] };
  const total = core.collect(groups, answers).flatMap(group => group.items).find(item => item.label.includes("total informado"));
  assert.equal(total.value, "2");
});

const origin = "https://gustavocarvalho96-lang.github.io";
const env = { OPENAI_API_KEY: "test", APP_TOKEN: "test", OPENAI_MODEL: "modelo-teste" };
const payload = { protocol: "dor-toracica", sections: [{ section: "SINTOMAS ASSOCIADOS", items: [{ label: "Dispneia", value: "Negado" }] }] };
function request(body = payload, headers = {}, pathname = "/api/protocolos/anamnese") {
  return new Request("https://worker.example" + pathname, { method: "POST", headers: { Origin: origin, Authorization: "Bearer test", "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
}

test("API dos protocolos usa instruções próprias, preserva seções e mantém store false", async () => {
  const response = await handleRequest(request(), env, async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.model, "modelo-teste");
    assert.equal(body.instructions, PROTOCOL_INSTRUCTIONS);
    assert.match(body.instructions, /Nunca acrescente negativas/);
    assert.deepEqual(JSON.parse(body.input), payload);
    assert.equal(body.store, false);
    assert.equal(body.text.format.name, "protocol_anamnese");
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ text: "# HMA:\nNega dispneia." }) }] }] });
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, "# HMA:\nNega dispneia.");
});

test("API valida estrutura, origem, autenticação, limite e preflight", async () => {
  assert.equal(validateProtocolPayload({ ...payload, protocol: "outro" }), false);
  assert.equal(validateProtocolPayload({ protocol: "dor-toracica", sections: [] }), false);
  assert.equal((await handleRequest(request({ ...payload, sections: [{ section: "HMA", items: [{ label: "Dor", value: "" }] }] }), env)).status, 400);
  assert.equal((await handleRequest(request(payload, { Origin: "https://outro.example" }), env)).status, 403);
  assert.equal((await handleRequest(request(payload, { Authorization: "Bearer incorreto" }), env)).status, 401);
  assert.equal((await handleRequest(request(), { ...env, HMA_RATE_LIMITER: { async limit() { return { success: false }; } } })).status, 429);
  const preflight = new Request("https://worker.example/api/protocolos/anamnese", { method: "OPTIONS", headers: { Origin: origin } });
  assert.equal((await handleRequest(preflight, env)).status, 204);
});

test("API rejeita roteiro excessivo e respostas incompletas ou inválidas da OpenAI", async () => {
  const large = { protocol: "dor-toracica", sections: [{ section: "HMA", items: Array.from({ length: 4 }, () => ({ label: "Detalhes", value: "x".repeat(9000) })) }] };
  assert.equal((await handleRequest(request(large), env)).status, 413);
  assert.equal((await handleRequest(request(), env, async () => Response.json({ status: "incomplete", output: [] }))).status, 502);
  assert.equal((await handleRequest(request(), env, async () => new Response("invalid"))).status, 502);
  assert.equal((await handleRequest(request(), env, async () => new Response("quota", { status: 429 }))).status, 429);
});

const formSource = await readFile(new URL("../Apps/GPlantao/plantao-protocolo-form.js", import.meta.url), "utf8");
function draftContext(initial) {
  const storage = new Map(initial || []);
  const sandbox = vm.createContext({ window: {}, ClinicalFormCore: core, state: {}, localStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); } }, clinicalDraftKey: p => "gplantao-" + p.id + "-draft-v1" });
  vm.runInContext(formSource, sandbox);
  return { sandbox, storage };
}

test("rascunho anterior não é importado nem enviado e é retirado do armazenamento", () => {
  const key = "gplantao-" + protocol.id + "-draft-v1";
  const { sandbox, storage } = draftContext([[key, JSON.stringify({ text: "Relato antigo digitado" })]]);
  const draft = sandbox.getClinicalFormDraft(protocol);
  assert.equal(draft.legacyText, undefined);
  assert.deepEqual(plain(sandbox.clinicalFormSections(protocol, draft)), []);
  assert.doesNotMatch(storage.get(key), /Relato antigo digitado/);
  draft.includeLegacy = true;
  draft.legacyText = "Texto antigo";
  assert.deepEqual(plain(sandbox.clinicalFormSections(protocol, draft)), []);
});

test("alterações invalidam cópia, reset não mistura rascunho da anamnese geral", () => {
  const { sandbox, storage } = draftContext([["gplantao-anamnese-draft-v1", "outro paciente"]]);
  const draft = sandbox.getClinicalFormDraft(protocol);
  draft.answers[field("Característica").id] = { selected: ["aperto"] };
  draft.snapshot = sandbox.clinicalFormSnapshot(protocol, draft);
  draft.result = "# HMA:\nDor em aperto.";
  assert.equal(sandbox.clinicalResultReady(protocol, draft), true);
  draft.answers[field("Característica").id].selected = ["queimação"];
  assert.equal(sandbox.clinicalResultReady(protocol, draft), false);
  sandbox.resetClinicalForm(protocol);
  assert.deepEqual(plain(sandbox.getClinicalFormDraft(protocol).answers), {});
  assert.equal(storage.get("gplantao-anamnese-draft-v1"), "outro paciente");
});

test("etapas 12 a 16 ficam em reavaliação e as duas abas entram no envio", () => {
  const { sandbox } = draftContext();
  const schema = sandbox.clinicalFormSchema(protocol);
  assert.equal(schema.filter(group => group.stage === "inicial").length, 11);
  assert.deepEqual(plain(schema.filter(group => group.stage === "reavaliacao").map(group => group.title)), ["TROPONINA", "ESTRATIFICAÇÃO CORONARIANA", "OUTROS ESCORES — CONFORME SUSPEITA CLÍNICA", "REAVALIAÇÃO", "OBSERVAÇÕES COMPLEMENTARES"]);
  const draft = sandbox.getClinicalFormDraft(protocol);
  draft.answers[field("Característica").id] = { selected: ["aperto"] };
  draft.answers[field("1ª coleta — horário / valor").id] = { text: "10:00 / resultado fictício" };
  const before = sandbox.clinicalFormSnapshot(protocol, draft);
  sandbox.clinicalFormTabs[protocol.id] = "reavaliacao";
  assert.equal(sandbox.clinicalFormSnapshot(protocol, draft), before);
  const sections = plain(sandbox.clinicalFormSections(protocol, draft));
  assert.equal(sections.length, 2);
  assert.equal(sections[0].section, "CARACTERIZAÇÃO DA DOR");
  assert.equal(sections[1].section, "TROPONINA");
});

test("nova API diferencia contexto inicial de exames e achados posteriores", async () => {
  const input = { protocol: "dor-toracica", initialSections: [{ section: "CARACTERIZAÇÃO DA DOR", items: [{ label: "Dor na chegada", value: "aperto" }] }], sections: [{ section: "TROPONINA", items: [{ label: "1ª coleta — horário / valor", value: "10:00 / resultado fictício" }] }] };
  const response = await handleRequest(request(input, {}, "/api/protocolos/reavaliacao"), env, async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.instructions, REASSESSMENT_INSTRUCTIONS);
    assert.notEqual(body.instructions, PROTOCOL_INSTRUCTIONS);
    assert.match(body.instructions, /não podem ser apresentados como achados atuais/);
    assert.match(body.instructions, /Não invente melhora/);
    assert.equal(body.text.format.name, "protocol_reassessment");
    assert.equal(body.store, false);
    assert.deepEqual(JSON.parse(body.input), input);
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ text: "# Reavaliação:\nResultado laboratorial registrado às 10:00." }) }] }] });
  });
  assert.equal(response.status, 200);
  assert.match((await response.json()).text, /^# Reavaliação:/);
});

test("reavaliação exige dados posteriores e mantém autenticação, CORS e limite", async () => {
  const input = { protocol: "dor-toracica", sections: [{ section: "REAVALIAÇÃO", items: [{ label: "Dor atual", value: "4/10" }] }] };
  const route = "/api/protocolos/reavaliacao";
  assert.equal(validateReassessmentPayload(input), true);
  assert.equal(validateReassessmentPayload({ ...input, initialSections: "inválido" }), false);
  assert.equal(validateReassessmentPayload({ ...input, sections: [], initialSections: payload.sections }), false);
  assert.equal(validateReassessmentPayload(payload), false);
  assert.equal((await handleRequest(request({ ...input, sections: [] }, {}, route), env)).status, 400);
  assert.equal((await handleRequest(request(input, { Authorization: "Bearer errado" }, route), env)).status, 401);
  assert.equal((await handleRequest(request(input, { Origin: "https://outro.example" }, route), env)).status, 403);
  assert.equal((await handleRequest(request(input, {}, route), { ...env, HMA_RATE_LIMITER: { async limit() { return { success: false }; } } })).status, 429);
  const preflight = new Request("https://worker.example" + route, { method: "OPTIONS", headers: { Origin: origin } });
  assert.equal((await handleRequest(preflight, env)).status, 204);
});

test("cada etapa tem geração, cópia e validade independentes", () => {
  const { sandbox, storage } = draftContext();
  const draft = sandbox.getClinicalFormDraft(protocol);
  draft.answers[field("Característica").id] = { selected: ["aperto"] };
  draft.answers[field("1ª coleta — horário / valor").id] = { text: "resultado fictício" };
  const initial = plain(sandbox.clinicalGenerationPayload(protocol, draft, "inicial"));
  const later = plain(sandbox.clinicalGenerationPayload(protocol, draft, "reavaliacao"));
  assert.equal(initial.sections.length, 1);
  assert.equal(initial.sections[0].section, "CARACTERIZAÇÃO DA DOR");
  assert.equal(later.sections.length, 1);
  assert.equal(later.sections[0].section, "TROPONINA");
  assert.deepEqual(later.initialSections, initial.sections);
  draft.result = "Anamnese inicial";
  draft.snapshot = sandbox.clinicalFormSnapshot(protocol, draft, "inicial");
  draft.reassessmentResult = "Evolução posterior";
  draft.reassessmentSnapshot = sandbox.clinicalFormSnapshot(protocol, draft, "reavaliacao");
  let copied;
  sandbox.copyText = text => { copied = text; };
  sandbox.clinicalFormTabs[protocol.id] = "reavaliacao";
  sandbox.copyProtocolText(protocol);
  assert.equal(copied, "Evolução posterior");
  sandbox.copyProtocolText(protocol, "inicial");
  assert.equal(copied, "Anamnese inicial");
  sandbox.persistClinicalForm(protocol, draft);
  sandbox.clinicalFormDrafts = {};
  const restored = sandbox.getClinicalFormDraft(protocol);
  assert.equal(restored.reassessmentResult, "Evolução posterior");
  restored.answers[field("1ª coleta — horário / valor").id] = { text: "outro resultado" };
  assert.equal(sandbox.clinicalResultReady(protocol, restored, "inicial"), true);
  assert.equal(sandbox.clinicalResultReady(protocol, restored, "reavaliacao"), false);
  assert.match(storage.values().next().value, /Evolução posterior/);
});
