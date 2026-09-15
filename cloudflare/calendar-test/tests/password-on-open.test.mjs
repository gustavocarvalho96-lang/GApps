import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const project = new URL("../", import.meta.url);

test("does not persist the calendar password in the source app", async () => {
  const page = await readFile(new URL("app/page.tsx", project), "utf8");
  assert.match(page, /let accessToken = ""/);
  assert.match(page, /window\.prompt\("Digite o código de acesso do calendário:/);
  assert.doesNotMatch(page, /localStorage\.(getItem|setItem).*TOKEN/i);
});

test("published standalone worker asks again after every page load", async () => {
  const worker = await readFile(
    new URL("worker/standalone.mjs", project),
    "utf8",
  );
  assert.match(worker, /let accessToken=''/);
  assert.match(worker, /if\(!accessToken\)accessToken=\(prompt\(/);
  assert.doesNotMatch(worker, /localStorage\.(getItem|setItem)\(TOKEN_KEY/);
});
