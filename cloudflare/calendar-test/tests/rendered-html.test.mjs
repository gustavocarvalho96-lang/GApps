import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { unstable_dev } from "wrangler";
import standaloneWorker from "../worker/standalone.mjs";

async function assertCalendar(response) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="pt-BR"/i);
  assert.match(html, /Resumo do mês/);
  assert.match(html, /Exportar CSV/);
  assert.doesNotMatch(html, /Limpar mês/i);
  assert.doesNotMatch(html, /Aplicar escala-base/i);
}

test("renders the Vinext calendar in a local Cloudflare Worker", async (context) => {
  const config = new URL("../dist/server/wrangler.json", import.meta.url);
  const worker = await unstable_dev(fileURLToPath(new URL("index.js", config)), {
    config: fileURLToPath(config),
    // The bundled local workerd predates the deployed compatibility date.
    compatibilityDate: "2026-05-15",
    bundle: false,
    local: true,
    persist: false,
    experimental: { disableExperimentalWarning: true, testMode: true },
  });
  context.after(() => worker.stop());
  await assertCalendar(await worker.fetch("/"));
});

test("renders the standalone calendar", async () => {
  await assertCalendar(await standaloneWorker.fetch(new Request("http://localhost/")));
});
