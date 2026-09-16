import { copyFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const files = [
  ["GPendencias.html", "site/GPendencias.html"],
  ["Apps/GPendencias/app.js", "site/Apps/GPendencias/app.js.txt"],
  ["Apps/GPendencias/styles.css", "site/Apps/GPendencias/styles.css"],
  ["Apps/GPendencias/sync-core.mjs", "site/Apps/GPendencias/sync-core.mjs.txt"],
  ["Apps/GPendencias/sync-core.mjs", "sync-core.mjs"],
  [
    "Apps/Shared/logo-stethoscope-c.svg",
    "site/Apps/Shared/logo-stethoscope-c.svg",
  ],
  ["Apps/Shared/browser-compat.js", "site/Apps/Shared/browser-compat.js.txt"],
];
for (const [source, target] of files) {
  await mkdir(path.dirname(path.join(here, target)), { recursive: true });
  await copyFile(path.join(root, source), path.join(here, target));
  if (
    !Buffer.from(await readFile(path.join(root, source))).equals(
      await readFile(path.join(here, target)),
    )
  )
    throw new Error("Copy mismatch: " + target);
}
console.log("Pendências: 7 arquivos de publicação sincronizados.");
