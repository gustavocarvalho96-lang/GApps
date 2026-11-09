import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../cloudflare/suporte/worker.mjs';

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../cloudflare/suporte/schema.sql', import.meta.url), 'utf8'));
  const env = {
    SUPPORT_TOKEN: 'test-only-password',
    DB: { prepare(sql) {
      const query = sqlite.prepare(sql);
      const bound = args => ({ first: async () => query.get(...args) || null, all: async () => ({ results: query.all(...args) }) });
      return { ...bound([]), bind: (...args) => bound(args) };
    } },
  };
  const call = (method = 'GET', path = '', body, headers = {}) => worker.fetch(new Request('https://gapps-suporte.gustavocarvalho96.workers.dev/api/notes' + path, {
    method, headers: { Authorization: 'Bearer test-only-password', 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), env);
  return { call, sqlite, env };
}
const note = { title: 'Melhorar formulário', body: '<script>Teste literal</script>\nDetalhes', app: 'Plantão', priority: 'Alta', status: 'Pendente' };

test('senha é obrigatória em todas as operações e falha sem secret configurado', async () => {
  const { call, env } = setup();
  for (const [method, path, body] of [['GET', '', undefined], ['POST', '', note], ['PUT', '/' + crypto.randomUUID(), { ...note, revision: 1 }], ['DELETE', '/' + crypto.randomUUID(), { revision: 1 }]]) {
    assert.equal((await call(method, path, body, { Authorization: '' })).status, 401);
    assert.equal((await call(method, path, body, { Authorization: 'Bearer wrong' })).status, 401);
  }
  env.SUPPORT_TOKEN = '';
  assert.equal((await call()).status, 401);
});

test('cria, consulta, edita e exclui com revisão atômica em SQLite', async () => {
  const { call } = setup();
  assert.deepEqual((await (await call()).json()).notes, []);
  const createdResponse = await call('POST', '', note);
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()).note;
  assert.equal(created.revision, 1);
  assert.equal(created.body, note.body);
  const path = '/' + created.id;
  assert.equal((await call('PUT', path, { ...note })).status, 428);
  const updated = await call('PUT', path, { ...note, status: 'Concluída', revision: 1 });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).note.revision, 2);
  assert.equal((await call('PUT', path, { ...note, title: 'Versão antiga', revision: 1 })).status, 409);
  assert.equal((await call('DELETE', path, { revision: 1 })).status, 409);
  const listed = (await (await call()).json()).notes;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].status, 'Concluída');
  assert.equal((await call('DELETE', path, { revision: 2 })).status, 200);
  assert.deepEqual((await (await call()).json()).notes, []);
});

test('rejeita origem estranha, dados inválidos e payload excessivo', async () => {
  const { call } = setup();
  assert.equal((await call('POST', '', note, { Origin: 'https://example.org' })).status, 403);
  const preflight = await call('OPTIONS', '', undefined, { Origin: 'https://gustavocarvalho96-lang.github.io' });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://gustavocarvalho96-lang.github.io');
  for (const invalid of [null, [], { ...note, title: '   ' }, { ...note, app: 'Outro' }, { ...note, status: 'Outro' }, { ...note, priority: 'Outra' }, { ...note, body: 'x'.repeat(20001) }]) assert.equal((await call('POST', '', invalid)).status, 400);
  assert.equal((await call('POST', '', { ...note, body: 'x'.repeat(100001) })).status, 413);
  assert.equal((await call('GET', '/invalid')).status, 400);
  assert.equal((await call('PATCH')).status, 405);
});

test('indisponibilidade do banco retorna erro e nunca confirma gravação', async () => {
  const { call, env } = setup();
  env.DB.prepare = () => { throw new Error('private database detail'); };
  const response = await call('POST', '', note);
  assert.equal(response.status, 503);
  assert.doesNotMatch(JSON.stringify(await response.json()), /private database detail/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('limite de tentativas bloqueia acesso antes de consultar o banco', async () => {
  const { call, env } = setup();
  env.ACCESS_LIMITER = { limit: async ({ key }) => { assert.equal(key, '192.0.2.1'); return { success: false }; } };
  env.DB.prepare = () => { throw new Error('não deve consultar'); };
  assert.equal((await call('GET', '', undefined, { 'CF-Connecting-IP': '192.0.2.1' })).status, 429);
});
