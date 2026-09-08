import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const sourcePath = path.join(projectDirectory, "HMA_INSTRUCTIONS.txt");
const outputPath = path.join(projectDirectory, "src", "hma-instructions.generated.mjs");
const instructions = (await readFile(sourcePath, "utf8")).trim();

if (!instructions) throw new Error("HMA_INSTRUCTIONS.txt está vazio.");

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  "// Gerado por scripts/sync-instructions.mjs. Edite HMA_INSTRUCTIONS.txt.\n" +
    "export const HMA_INSTRUCTIONS = " + JSON.stringify(instructions) + ";\n",
  "utf8"
);

console.log("Instruções da HMA sincronizadas.");
