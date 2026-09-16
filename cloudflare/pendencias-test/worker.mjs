import PAGE_HTML from "./site/GPendencias.html";
import APP_JS from "./site/Apps/GPendencias/app.js.txt";
import APP_CSS from "./site/Apps/GPendencias/styles.css";
import APP_LOGO from "./site/Apps/Shared/logo-stethoscope-c.svg";
import BROWSER_COMPAT from "./site/Apps/Shared/browser-compat.js.txt";
import SYNC_CORE from "./site/Apps/GPendencias/sync-core.mjs.txt";
import { validTasks } from "./sync-core.mjs";

const ALLOWED_ORIGINS = new Set(["https://gustavocarvalho96-lang.github.io"]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const localOrigin = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin":
      ALLOWED_ORIGINS.has(origin) || localOrigin
        ? origin
        : "https://gustavocarvalho96-lang.github.io",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(request, data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function sessionFromRequest(request) {
  const password = (request.headers.get("Authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  return /^[1-9]$/.test(password) ? password : null;
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch {
      // Do not log patient content or credentials.
      console.error(JSON.stringify({ event: "pendencias_request_failed" }));
      return json(
        request,
        { error: "Serviço temporariamente indisponível. Tente novamente." },
        503,
      );
    }
  },
};

async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  if (url.pathname === "/api/health") {
    return json(request, { service: "GPendencias", status: "online" });
  }
  if (url.pathname === "/" || url.pathname === "/GPendencias.html") {
    return new Response(PAGE_HTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  if (url.pathname === "/Apps/GPendencias/app.js") {
    return new Response(APP_JS, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  if (url.pathname === "/Apps/GPendencias/sync-core.mjs") {
    return new Response(SYNC_CORE, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  if (url.pathname === "/Apps/GPendencias/styles.css") {
    return new Response(APP_CSS, {
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  if (url.pathname === "/Apps/Shared/logo-stethoscope-c.svg") {
    return new Response(APP_LOGO, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
  if (url.pathname === "/Apps/Shared/browser-compat.js") {
    return new Response(BROWSER_COMPAT, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  if (url.pathname === "/Menu.html") {
    return Response.redirect(
      "https://gustavocarvalho96-lang.github.io/GApps/Menu.html",
      302,
    );
  }
  if (url.pathname !== "/api/tasks")
    return json(request, { error: "Não encontrado" }, 404);

  const sessionKey = sessionFromRequest(request);
  if (!sessionKey) return json(request, { error: "Senha inválida" }, 401);

  if (request.method === "GET") {
    const row = await env.DB.prepare(
      "SELECT tasks_json, revision, updated_at FROM pendencias_sessions WHERE session_key = ?",
    )
      .bind(sessionKey)
      .first();
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
      // Bound the actual stream, including requests without Content-Length.
      const reader = request.body?.getReader();
      if (!reader) return json(request, { error: "Conteúdo ausente" }, 400);
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4_000_000) {
          await reader.cancel();
          return json(request, { error: "Conteúdo muito grande" }, 413);
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      payload = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return json(request, { error: "Conteúdo inválido" }, 400);
    }
    if (!validTasks(payload?.tasks))
      return json(
        request,
        { error: "Lista de pendências inválida ou muito grande" },
        400,
      );
    if (!Number.isSafeInteger(payload.revision) || payload.revision < 0)
      return json(
        request,
        { error: "Atualize a página para usar a nova sincronização." },
        428,
      );
    const tasksJson = JSON.stringify(payload.tasks);
    const updatedAt = Date.now();
    const row = await env.DB.prepare(
      "UPDATE pendencias_sessions SET tasks_json = ?, revision = revision + 1, updated_at = ? WHERE session_key = ? AND revision = ? RETURNING revision",
    )
      .bind(tasksJson, updatedAt, sessionKey, payload.revision)
      .first();
    if (!row) {
      const current = await env.DB.prepare(
        "SELECT tasks_json, revision, updated_at FROM pendencias_sessions WHERE session_key = ?",
      )
        .bind(sessionKey)
        .first();
      if (!current)
        return json(request, { error: "Sessão não encontrada" }, 404);
      return json(
        request,
        {
          error: "A sessão mudou em outro dispositivo",
          tasks: JSON.parse(current.tasks_json),
          revision: current.revision,
          updatedAt: current.updated_at,
        },
        409,
      );
    }
    return json(request, {
      saved: true,
      session: sessionKey,
      revision: Number(row?.revision || 0),
      updatedAt,
    });
  }

  return json(request, { error: "Método não permitido" }, 405);
}
