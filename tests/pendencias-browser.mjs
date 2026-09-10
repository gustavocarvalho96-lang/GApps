// Run with the app served on 127.0.0.1:8765. All API traffic is intercepted; no live data is written.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE)
    : "playwright"
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const errors = [];
const state = { tasks: [], revision: 0 };
let offline = false;
await context.route("**/api/tasks", async (route) => {
  if (offline) return route.abort("internetdisconnected");
  const request = route.request();
  if (request.method() === "PUT") {
    const payload = request.postDataJSON();
    if (payload.revision !== state.revision)
      return route.fulfill({ status: 409, json: state });
    state.tasks = payload.tasks;
    state.revision++;
  }
  await route.fulfill({
    json: { ...state, session: "9", updatedAt: Date.now() },
  });
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8765/GPendencias.html");
await page.locator("#session-password").fill("9");
await page.getByRole("button", { name: "Entrar na sessão" }).click();
await page.locator("#session-screen").waitFor({ state: "hidden" });
assert.equal(await page.locator("#entry-dialog").isVisible(), false);
await page.locator("#toggle-form-button").click();
await page.locator("#patient-input").fill("Leito 04 · Teste fictício");
await page
  .locator("#task-form [name=diagnosis]")
  .fill("Contexto registrado pela equipe");
await page
  .locator("#task-form [name=nextAction]")
  .fill("Reavaliar após resultado");
await page.locator("#task-form [name=owner]").fill("Equipe A");
await page.locator("#pending-items [name=task]").fill("Conferir exame");
await page.locator("#pending-items [name=priority]").selectOption("high");
await page.locator("#pending-items [name=dueAt]").fill("2026-09-10T10:00");
await page.locator("#add-item-button").click();
await page
  .locator("#pending-items [name=task]")
  .nth(1)
  .fill("Reavaliar paciente");
await page.locator("#task-form button[type=submit]").click();
await page.waitForFunction(
  () => document.querySelector("#save-status").textContent === "Sincronizado",
);
assert.equal(state.tasks.length, 2);
assert.ok(state.tasks[0].dueAt.endsWith("Z"));
assert.equal(await page.locator(".task-card").count(), 1);
await page.locator("#search-input").fill("inexistente");
assert.equal(await page.locator(".task-card").count(), 0);
await page.locator("#search-input").fill("");
await page.locator(".edit-subtask-button").first().click();
await page
  .locator(".subtask-edit-form:not([hidden]) [name=task]")
  .fill("Reavaliar e registrar evolução");
await page
  .locator(".subtask-edit-form:not([hidden]) button[type=submit]")
  .click();
await page.waitForFunction(
  () => document.querySelector("#save-status").textContent === "Sincronizado",
);
await page.locator(".subtask-checkbox").first().click();
await page.waitForFunction(
  () => document.querySelector("#save-status").textContent === "Sincronizado",
);
assert.equal(state.tasks.filter((t) => t.done).length, 1);
await page.locator("#handoff-button").click();
const handoff = await page.locator("#handoff-text").inputValue();
assert.ok(handoff.includes("Reavaliar após resultado"));
assert.ok(handoff.includes("Equipe A"));
assert.ok(!handoff.includes("Reavaliar e registrar evolução"));
await page.getByRole("button", { name: "Fechar passagem" }).click();
await page.screenshot({
  path: process.env.TEMP + "/pendencias-desktop.png",
  fullPage: true,
});
// Protect local edits on network failure, including reload and retry.
offline = true;
await page.locator(".subtask-checkbox:checked").click();
await page.waitForFunction(() =>
  document.querySelector("#save-status").textContent.includes("Falha"),
);
assert.ok(
  await page.evaluate(() =>
    Object.keys(localStorage).some((k) =>
      k.startsWith("gpendencias-outbox-v2-"),
    ),
  ),
);
await page.reload();
await page.locator("#session-screen").waitFor({ state: "visible" });
offline = false;
await page.locator("#session-password").fill("9");
await page.locator("#session-form button[type=submit]").click();
await page.waitForFunction(
  () => document.querySelector("#save-status").textContent === "Sincronizado",
);
assert.equal(state.tasks.filter((t) => t.done).length, 0);
// A remote conflicting field must show a review UI, and choosing online preserves the peer edit.
await page.locator(".edit-subtask-button").first().click();
const target = state.tasks.find(
  (t) => t.description === "Reavaliar e registrar evolução",
);
target.description = "Alterado por colega";
state.revision++;
await page
  .locator(".subtask-edit-form:not([hidden]) [name=task]")
  .fill("Minha edição concorrente");
await page
  .locator(".subtask-edit-form:not([hidden]) button[type=submit]")
  .click();
await page.locator("#conflict-banner").waitFor({ state: "visible" });
await page.locator("#review-conflicts").click();
await page.locator("#conflict-items input[value=remote]").check();
await page.locator("#conflict-form button[type=submit]").click();
await page.waitForFunction(
  () => document.querySelector("#save-status").textContent === "Sincronizado",
);
assert.ok(state.tasks.some((t) => t.description === "Alterado por colega"));
await page.setViewportSize({ width: 390, height: 844 });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({
  path: process.env.TEMP + "/pendencias-mobile.png",
  fullPage: true,
});
await page.locator("#toggle-form-button").click();
assert.ok(
  await page.evaluate(
    () =>
      document.querySelector("#entry-dialog").scrollWidth <=
      document.querySelector("#entry-dialog").clientWidth,
  ),
);
await page.keyboard.press("Escape");
assert.equal(await page.locator("#entry-dialog").isVisible(), false);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "PASS: cadastro, edição, conclusão, busca, passagem, offline/reload, conflito, mobile e diálogos; sem gravações online.",
);
