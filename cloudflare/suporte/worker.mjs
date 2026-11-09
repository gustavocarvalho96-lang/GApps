const APPS = ['Geral', 'Plantão', 'Transcritor', 'Fluxo', 'Pendências', 'Calendário', 'Suporte'];
const STATUSES = ['Pendente', 'Em andamento', 'Concluída'];
const PRIORITIES = ['Normal', 'Alta', 'Baixa'];
const ALLOWED_ORIGINS = new Set(['https://gustavocarvalho96-lang.github.io', 'https://gapps-suporte.gustavocarvalho96.workers.dev']);
const ID = /^[a-f0-9-]{36}$/;

export async function authorized(request, env) {
  const provided = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!provided || provided.length > 256 || !env.SUPPORT_TOKEN) return false;
  const digest = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hashes = await Promise.all([digest(provided), digest(env.SUPPORT_TOKEN)]);
  const a = new Uint8Array(hashes[0]), b = new Uint8Array(hashes[1]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function validateNote(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.trim().length > 160 || typeof value.body !== 'string' || value.body.length > 20000) return null;
  if (!APPS.includes(value.app) || !STATUSES.includes(value.status) || !PRIORITIES.includes(value.priority)) return null;
  return { title: value.title.trim(), body: value.body, app: value.app, status: value.status, priority: value.priority };
}

const columns = 'id, title, body, app, status, priority, revision, created_at AS createdAt, updated_at AS updatedAt';
async function notesApi(request, env, url, reply) {
  if (!(await authorized(request, env))) return reply({ error: 'Senha incorreta ou sessão encerrada.' }, 401);
  const id = url.pathname.slice('/api/notes'.length).replace(/^\//, '');
  if (id && !ID.test(id)) return reply({ error: 'Anotação inválida.' }, 400);
  if (request.method === 'GET' && !id) {
    const rows = await env.DB.prepare(`SELECT ${columns} FROM support_notes ORDER BY updated_at DESC, id`).all();
    return reply({ notes: rows.results });
  }
  if (!['POST', 'PUT', 'DELETE'].includes(request.method) || (request.method === 'POST' ? id : !id)) return reply({ error: 'Método não permitido.' }, 405);
  if (Number(request.headers.get('Content-Length') || 0) > 100000) return reply({ error: 'Anotação muito grande.' }, 413);
  // Limit the stream itself too: Content-Length can be absent or inaccurate.
  let bytes = 0;
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: 'Dados inválidos.' }, 400);
  const chunks = [];
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 100000) { await reader.cancel(); return reply({ error: 'Anotação muito grande.' }, 413); }
    chunks.push(chunk.value);
  }
  let input;
  try { input = JSON.parse(await new Blob(chunks).text()); } catch { return reply({ error: 'Dados inválidos.' }, 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply({ error: 'Dados inválidos.' }, 400);
  if (request.method !== 'POST' && (!Number.isSafeInteger(input.revision) || input.revision < 1)) return reply({ error: 'Atualize a anotação antes de salvar.' }, 428);
  if (request.method === 'DELETE') {
    const removed = await env.DB.prepare('DELETE FROM support_notes WHERE id = ? AND revision = ? RETURNING id').bind(id, input.revision).first();
    return removed ? reply({ ok: true }) : reply({ error: 'A anotação mudou em outro dispositivo ou foi excluída.' }, 409);
  }
  const value = validateNote(input);
  if (!value) return reply({ error: 'Preencha um título e confira os campos da anotação.' }, 400);
  const now = new Date().toISOString();
  if (request.method === 'POST') {
    const newId = crypto.randomUUID();
    const note = await env.DB.prepare(`INSERT INTO support_notes (id, title, body, app, status, priority, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?) RETURNING ${columns}`).bind(newId, value.title, value.body, value.app, value.status, value.priority, now, now).first();
    return reply({ note }, 201);
  }
  const note = await env.DB.prepare(`UPDATE support_notes SET title = ?, body = ?, app = ?, status = ?, priority = ?, updated_at = ?, revision = revision + 1 WHERE id = ? AND revision = ? RETURNING ${columns}`).bind(value.title, value.body, value.app, value.status, value.priority, now, id, input.revision).first();
  return note ? reply({ note }) : reply({ error: 'A anotação mudou em outro dispositivo ou foi excluída.' }, 409);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/notes' || url.pathname.startsWith('/api/notes/')) {
      const origin = request.headers.get('Origin');
      const allowed = !origin || ALLOWED_ORIGINS.has(origin) || (env.LOCAL_DEV === 'true' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
      const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
      if (origin && allowed) headers['Access-Control-Allow-Origin'] = origin;
      const reply = (data, status = 200) => Response.json(data, { status, headers });
      if (!allowed) return reply({ error: 'Origem não autorizada.' }, 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' } });
      try {
        if (env.ACCESS_LIMITER) {
          const { success } = await env.ACCESS_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
          if (!success) return reply({ error: 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.' }, 429);
        }
        return await notesApi(request, env, url, reply);
      }
      catch { return reply({ error: 'Não foi possível acessar o banco online. Tente novamente; suas alterações continuam no formulário.' }, 503); }
    }
    const assetUrl = new URL(request.url);
    if (assetUrl.pathname === '/' || assetUrl.pathname === '/index.html') assetUrl.pathname = '/Suporte.html';
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    return new Response(response.body, { status: response.status, headers });
  },
};
