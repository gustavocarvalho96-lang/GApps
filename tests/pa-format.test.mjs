import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../Apps/GPlantao/plantao-reavaliacao.js", import.meta.url), "utf8");
const context = {};
vm.runInNewContext(source, context);

test("mantem ate tres digitos em cada termo da PA", () => {
  assert.equal(context.normalizeReavaliacaoPa("130x100"), "130x100");
  assert.equal(context.normalizeReavaliacaoPa("130X100"), "130x100");
  assert.equal(context.normalizeReavaliacaoPa("130/100"), "130x100");
  assert.equal(context.normalizeReavaliacaoPa("1300x1000"), "130x100");
});

test("formata PA digitada sem separador", () => {
  assert.equal(context.normalizeReavaliacaoPa("12080"), "120x80");
  assert.equal(context.normalizeReavaliacaoPa("130100"), "130x100");
  assert.equal(context.normalizeReavaliacaoPa("9080"), "90x80");
});
