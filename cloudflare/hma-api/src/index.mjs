import { HMA_INSTRUCTIONS } from "./hma-instructions.generated.mjs";

export { HMA_INSTRUCTIONS };

const DEFAULT_ORIGIN = "https://gustavocarvalho96-lang.github.io";

const HMA_RESPONSE_FORMAT = {
  type: "json_schema",
  name: "hma_review",
  strict: true,
  schema: {
    type: "object",
    properties: {
      text: { type: "string" },
      alarm_signs: { type: "array", items: { type: "string" }, maxItems: 6 }
    },
    required: ["text", "alarm_signs"],
    additionalProperties: false
  }
};

function responseHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff"
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
}

function extractOutput(data) {
  return (data.output || []).filter(item => item.type === "message")
    .flatMap(item => item.content || []).filter(item => item.type === "output_text")
    .map(item => item.text).join("\n").trim();
}

function joinAlarmSigns(items) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", nega ")} e nega ${items.at(-1)}`;
}

export function appendAlarmNegatives(text, items) {
  const revised = text.trim();
  if (!items.length) return revised;
  const punctuated = revised && !/[.!?]$/.test(revised) ? `${revised}.` : revised;
  return `${punctuated}${punctuated ? " " : ""}Nega ${joinAlarmSigns(items)}.`;
}

async function verifyToken(provided, expected) {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
  }
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function handleRequest(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
  if (url.pathname === "/health" && request.method === "GET") return json(200, { status: "ok" }, allowedOrigin);
  if (url.pathname !== "/api/hma") return json(404, { error: "Rota não encontrada." }, allowedOrigin);
  if (origin !== allowedOrigin) return json(403, { error: "Origem não autorizada." }, allowedOrigin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(origin) });
  if (request.method !== "POST") return json(405, { error: "Use POST." }, origin);
  if (!env.OPENAI_API_KEY || !env.APP_TOKEN) return json(503, { error: "Servidor ainda não configurado." }, origin);
  const authorization = request.headers.get("Authorization") || "";
  const providedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!(await verifyToken(providedToken, env.APP_TOKEN))) return json(401, { error: "Código de acesso inválido." }, origin);
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return json(415, { error: "Conteúdo inválido." }, origin);
  if (env.HMA_RATE_LIMITER) {
    const key = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await env.HMA_RATE_LIMITER.limit({ key });
    if (!limit.success) return json(429, { error: "Muitas revisões em pouco tempo. Aguarde um minuto." }, origin);
  }
  let payload;
  try { payload = await request.json(); } catch { return json(400, { error: "Pedido inválido." }, origin); }
  if (typeof payload?.text !== "string" || !payload.text.trim()) return json(400, { error: "Preencha a HMA antes de revisar." }, origin);
  if (payload.text.length > 12000) return json(413, { error: "A HMA deve ter até 12.000 caracteres." }, origin);
  let openaiResponse;
  try {
    openaiResponse = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5.4-mini",
        instructions: HMA_INSTRUCTIONS,
        input: payload.text.trim(),
        text: { format: HMA_RESPONSE_FORMAT, verbosity: "low" },
        store: false,
        max_output_tokens: 4096
      })
    });
  } catch { return json(502, { error: "Não foi possível conectar à OpenAI." }, origin); }
  if (!openaiResponse.ok) {
    const message = openaiResponse.status === 401 ? "A chave da OpenAI precisa ser revisada." : openaiResponse.status === 429 ? "O limite ou saldo da OpenAI foi atingido." : "A OpenAI não conseguiu revisar a HMA.";
    return json(openaiResponse.status === 429 ? 429 : 502, { error: message }, origin);
  }
  const data = await openaiResponse.json();
  const output = extractOutput(data);
  if (data.status !== "completed" || !output) return json(502, { error: "A revisão não foi concluída." }, origin);
  let review;
  try { review = JSON.parse(output); } catch { return json(502, { error: "A revisão retornou um formato inválido." }, origin); }
  if (typeof review?.text !== "string" || !review.text.trim() || !Array.isArray(review.alarm_signs)) {
    return json(502, { error: "A revisão retornou um formato inválido." }, origin);
  }
  const alarmSigns = review.alarm_signs
    .filter(item => typeof item === "string")
    .map(item => item.replace(/^\s*nega\s+/i, "").replace(/[.;]+\s*$/, "").trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 6);
  return json(200, { text: appendAlarmNegatives(review.text, alarmSigns), alarmSigns }, origin);
}

export default { fetch(request, env) { return handleRequest(request, env); } };
