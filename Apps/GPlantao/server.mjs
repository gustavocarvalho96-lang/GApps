import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { improveHma } from "./hma-api.mjs";
import { spawn } from "node:child_process";

const root = fileURLToPath(new URL("../../", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const json = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };

export function createHmaServer({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-5.4-mini", revise = improveHma } = {}) {
  let busy = false;
  return createServer(async (req, res) => {
    try {
      const address = `127.0.0.1:${req.socket.localPort}`;
      if (req.headers.host !== address) return json(res, 403, { error: "Endereço local inválido." });
      const url = new URL(req.url, `http://${address}`);
      if (url.pathname === "/api/hma") {
        if (req.method !== "POST") return json(res, 405, { error: "Use POST." });
        if (req.headers.origin !== `http://${address}` || req.headers["content-type"] !== "application/json") return json(res, 403, { error: "Abra o GPlantão pelo servidor local." });
        if (!apiKey) return json(res, 503, { error: "Configure OPENAI_API_KEY no servidor para ativar a revisão." });
        if (busy) return json(res, 429, { error: "Já existe uma revisão em andamento. Aguarde." });
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 48000) return json(res, 413, { error: "Texto muito longo." });
          chunks.push(chunk);
        }
        let payload;
        try { payload = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return json(res, 400, { error: "Pedido inválido." }); }
        if (typeof payload?.text !== "string" || !payload.text.trim() || payload.text.length > 12000) return json(res, 400, { error: "Preencha uma HMA de até 12.000 caracteres." });
        if (busy) return json(res, 429, { error: "Já existe uma revisão em andamento. Aguarde." });
        busy = true;
        try { return json(res, 200, { text: await revise(payload.text.trim(), { apiKey, model }) }); }
        catch (error) { return json(res, error.status || 502, { error: error.name === "TimeoutError" ? "A revisão demorou demais. Tente novamente." : error.message === "fetch failed" ? "Não foi possível conectar à OpenAI." : error.message }); }
        finally { busy = false; }
      }
      if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Método inválido." });
      const pathname = decodeURIComponent(url.pathname === "/" ? "/GPlantao.html" : url.pathname);
      if (pathname.split(/[\\/]/).some(part => part.startsWith(".")) || !types[extname(pathname)]) return json(res, 404, { error: "Arquivo não encontrado." });
      const path = await realpath(resolve(root, "." + pathname));
      const rel = relative(await realpath(root), path);
      if (rel.startsWith(".." + sep) || rel === ".." || !(await stat(path)).isFile()) return json(res, 404, { error: "Arquivo não encontrado." });
      const content = await readFile(path);
      res.writeHead(200, { "Content-Type": types[extname(path)], "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch { if (!res.headersSent) json(res, 404, { error: "Arquivo ou pedido inválido." }); else res.end(); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 5174);
  createHmaServer().listen(port, "127.0.0.1", () => {
    const address = `http://127.0.0.1:${port}/GPlantao.html`;
    console.log(`GPlantão: ${address}`);
    if (process.env.HMA_OPEN_BROWSER === "1" && process.platform === "win32") {
      const browser = spawn("explorer.exe", [address], { windowsHide: true, stdio: "ignore" });
      browser.on("error", () => console.log("Abra o endereço acima no navegador."));
      browser.unref();
    }
  });
}
