import PAGE_HTML from "./site/GPendencias.html";
import APP_JS from "./site/Apps/GPendencias/app.js.txt";
import APP_CSS from "./site/Apps/GPendencias/styles.css";
import APP_LOGO from "./site/Apps/Shared/logo-stethoscope-c.svg";

const ALLOWED_ORIGINS = new Set([
  "https://gustavocarvalho96-lang.github.io",
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const localOrigin = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) || localOrigin ? origin : "https://gustavocarvalho96-lang.github.io",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(request, data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function sessionFromRequest(request) {
  const password = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return /^[1-9]$/.test(password) ? password : null;
}

function validTasks(value) {
  if (!Array.isArray(value) || value.length > 1000) return null;
  const serialized = JSON.stringify(value);
  if (serialized.length > 900_000) return null;
  return serialized;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json(request, { service: "GPendencias", status: "online" });
    }
    if (url.pathname === "/" || url.pathname === "/GPendencias.html") {
      return new Response(PAGE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (url.pathname === "/Apps/GPendencias/app.js") {
      return new Response(APP_JS, {
        headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (url.pathname === "/Apps/GPendencias/styles.css") {
      return new Response(APP_CSS, {
        headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (url.pathname === "/Apps/Shared/logo-stethoscope-c.svg") {
      return new Response(APP_LOGO, {
        headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400" }
      });
    }
    if (url.pathname === "/Menu.html") {
      return Response.redirect("https://gustavocarvalho96-lang.github.io/GApps/Menu.html", 302);
    }
    if (url.pathname !== "/api/tasks") return json(request, { error: "Não encontrado" }, 404);

    const sessionKey = sessionFromRequest(request);
    if (!sessionKey) return json(request, { error: "Senha inválida" }, 401);

    if (request.method === "GET") {
      const row = await env.DB.prepare(
        "SELECT tasks_json, revision, updated_at FROM pendencias_sessions WHERE session_key = ?"
      ).bind(sessionKey).first();
      if (!row) return json(request, { error: "Sessão não encontrada" }, 404);
      return json(request, {
        session: sessionKey,
        tasks: JSON.parse(row.tasks_json || "[]"),
        revision: Number(row.revision || 0),
        updatedAt: Number(row.updated_at || 0),
      });
    }

    if (request.method === "PUT") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json(request, { error: "Conteúdo inválido" }, 400);
      }
      const tasksJson = validTasks(payload?.tasks);
      if (tasksJson === null) return json(request, { error: "Lista de pendências inválida ou muito grande" }, 400);
      const updatedAt = Date.now();
      await env.DB.prepare(
        "UPDATE pendencias_sessions SET tasks_json = ?, revision = revision + 1, updated_at = ? WHERE session_key = ?"
      ).bind(tasksJson, updatedAt, sessionKey).run();
      const row = await env.DB.prepare(
        "SELECT revision FROM pendencias_sessions WHERE session_key = ?"
      ).bind(sessionKey).first();
      return json(request, {
        saved: true,
        session: sessionKey,
        revision: Number(row?.revision || 0),
        updatedAt,
      });
    }

    return json(request, { error: "Método não permitido" }, 405);
  },
};
