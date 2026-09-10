import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mergeTasks, validTasks } from "../Apps/GPendencias/sync-core.mjs";
const task = (id = "a", extra = {}) => ({
  id,
  groupId: "g",
  patient: "Paciente fictício",
  description: "Conferir exame",
  done: false,
  ...extra,
});
test("edits on different patients and fields are preserved", () => {
  const base = [task(), task("b")];
  const local = [task("a", { done: true }), task("b")];
  const remote = [
    task("a", { description: "Resultado disponível" }),
    task("b", { note: "Reavaliar" }),
  ];
  const merged = mergeTasks(base, local, remote);
  assert.equal(merged.conflicts.length, 0);
  assert.equal(merged.tasks[0].done, true);
  assert.equal(merged.tasks[0].description, "Resultado disponível");
  assert.equal(merged.tasks[1].note, "Reavaliar");
});
test("same field conflicts require a decision", () => {
  const merged = mergeTasks(
    [task()],
    [task("a", { description: "local" })],
    [task("a", { description: "remote" })],
  );
  assert.equal(merged.conflicts[0].field, "description");
  assert.equal(merged.conflicts[0].remote, "remote");
});
test("remote deletion never resurrects from an untouched cache", () => {
  assert.deepEqual(mergeTasks([task()], [task()], []), {
    tasks: [],
    conflicts: [],
  });
  assert.equal(
    mergeTasks([task()], [task("a", { done: true })], []).conflicts[0].field,
    "*",
  );
});
test("lost response retry is idempotent, concurrent additions survive", () => {
  assert.deepEqual(mergeTasks([], [task()], [task()]), {
    tasks: [task()],
    conflicts: [],
  });
  assert.equal(mergeTasks([], [task()], [task("b")]).tasks.length, 2);
});
test("validates import and server data before use", () => {
  assert.ok(validTasks([task()]));
  assert.ok(validTasks([]));
  for (const invalid of [
    [null],
    [task(), task()],
    [{ id: "x" }],
    [task("a", { note: { html: "bad" } })],
  ])
    assert.equal(validTasks(invalid), false);
});

// Load the exact handler without Cloudflare's Text-module loader; exercise its SQL contract.
const source = (
  await readFile(
    new URL("../cloudflare/pendencias-test/worker.mjs", import.meta.url),
    "utf8",
  )
)
  .replace(/^import .*;\r?\n/gm, "")
  .replace("export default", "const worker =");
const worker = Function(
  "validTasks",
  "PAGE_HTML",
  "APP_JS",
  "APP_CSS",
  "APP_LOGO",
  "SYNC_CORE",
  source + ";return worker;",
)(validTasks, "html", "js", "css", "svg", "core");
const rows = new Map([
  ["1", { tasks_json: "[]", revision: 0, updated_at: 0 }],
  ["2", { tasks_json: "[]", revision: 0, updated_at: 0 }],
]);
const DB = {
  prepare(sql) {
    return {
      bind(...params) {
        return {
          async first() {
            if (sql.startsWith("SELECT"))
              return structuredClone(rows.get(params[0]) || null);
            const [json, at, key, revision] = params,
              row = rows.get(key);
            if (!row || row.revision !== revision) return null;
            row.tasks_json = json;
            row.updated_at = at;
            row.revision++;
            return { revision: row.revision };
          },
        };
      },
    };
  },
};
const request = (session, payload) =>
  new Request("https://example.test/api/tasks", {
    method: payload ? "PUT" : "GET",
    headers: {
      Authorization: "Bearer " + session,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
test("worker atomically rejects stale writes and isolates sessions", async () => {
  const [a, b] = await Promise.all([
    worker.fetch(request("1", { tasks: [task()], revision: 0 }), { DB }),
    worker.fetch(request("1", { tasks: [task("b")], revision: 0 }), { DB }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  assert.equal(
    (await (await worker.fetch(request("1"), { DB })).json()).tasks.length,
    1,
  );
  assert.deepEqual(
    (await (await worker.fetch(request("2"), { DB })).json()).tasks,
    [],
  );
  assert.equal((await worker.fetch(request("0"), { DB })).status, 401);
  assert.equal(
    (await worker.fetch(request("1", { tasks: [task()] }), { DB })).status,
    428,
  );
  assert.equal(
    (await worker.fetch(request("1", { tasks: [null], revision: 1 }), { DB }))
      .status,
    400,
  );
});
