import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../Apps/Shared/browser-compat.js", import.meta.url), "utf8");

function loadCompat(overrides = {}) {
  const window = {
    AbortController,
    AbortSignal: function AbortSignalLegacy() {},
    DOMException,
    Error,
    JSON,
    Math,
    Promise,
    Uint8Array,
    crypto: { getRandomValues(array) { return globalThis.crypto.getRandomValues(array); } },
    document: overrides.document,
    navigator: overrides.navigator || {},
    setTimeout,
    ...overrides.window
  };
  vm.runInNewContext(source, { window });
  return window.GAppsCompat;
}

test("cria sinal de timeout quando AbortSignal.timeout não existe", async () => {
  const compat = loadCompat();
  const signal = compat.timeoutSignal(1);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(signal.aborted, true);
  assert.equal(signal.reason.name, "TimeoutError");
});

test("usa cópia antiga quando Clipboard API é bloqueada", async () => {
  let copied = false;
  const body = { appendChild() {}, removeChild() {} };
  const compat = loadCompat({
    navigator: { clipboard: { writeText() { return Promise.reject(new Error("blocked")); } } },
    document: {
      body,
      createElement() {
        return { style: {}, setAttribute() {}, focus() {}, select() {} };
      },
      execCommand(command) { copied = command === "copy"; return copied; }
    }
  });
  await compat.copyText("teste");
  assert.equal(copied, true);
});

test("tolera armazenamento bloqueado pelo navegador", () => {
  const compat = loadCompat({ window: { localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } } } });
  assert.equal(compat.storageGet("localStorage", "key"), null);
  assert.equal(compat.storageSet("localStorage", "key", "value"), false);
  assert.doesNotThrow(() => compat.storageRemove("localStorage", "key"));
});
