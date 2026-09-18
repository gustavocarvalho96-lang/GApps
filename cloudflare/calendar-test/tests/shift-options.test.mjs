import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const project = new URL("../", import.meta.url);

test("oferece CL 13-19 com valor de 650 sem criar lançamento", async () => {
  const [page, route, worker] = await Promise.all([
    readFile(new URL("app/page.tsx", project), "utf8"),
    readFile(new URL("app/api/schedules/route.ts", project), "utf8"),
    readFile(new URL("worker/standalone.mjs", project), "utf8"),
  ]);

  assert.match(page, /name: "CL 13-19", rate: 650, tone: "cl-13-19"/);
  assert.match(route, /"CL 13-19"/);
  assert.match(worker, /\['CL 13-19','cl-13-19',650\]/);
  assert.match(worker, /subtotal:count\*item\[2\]/);
  assert.doesNotMatch(worker, /shifts:\['CL 13-19'\]/);
});
