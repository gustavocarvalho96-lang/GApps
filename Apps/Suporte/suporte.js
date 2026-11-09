(() => {
  'use strict';
  const API = location.hostname.endsWith('.workers.dev') || ['localhost', '127.0.0.1'].includes(location.hostname) ? '' : 'https://gapps-suporte.gustavocarvalho96.workers.dev';
  const APPS = ['Geral', 'Plantão', 'Transcritor', 'Fluxo', 'Pendências', 'Calendário', 'Suporte'];
  const $ = id => document.getElementById(id);
  let token = '', notes = [], editing = null, busy = false;
  for (const id of ['app', 'appFilter']) for (const name of APPS) $(id).add(new Option(name, name));
  async function api(path, options = {}) {
    let response;
    try { response = await fetch(API + '/api/notes' + path, { ...options, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } }); }
    catch { throw new Error('Sem conexão com o servidor. Confira a internet e tente novamente; o texto continua no formulário.'); }
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) { token = ''; $('workspace').hidden = true; $('loginPanel').hidden = false; $('logout').hidden = true; $('loginStatus').textContent = 'Senha incorreta ou sessão encerrada.'; }
      const error = new Error(data.error || 'Não foi possível salvar. Tente novamente.'); error.status = response.status; throw error;
    }
    return data;
  }
  function render() {
    const query = $('search').value.toLocaleLowerCase('pt-BR');
    const filtered = notes.filter(n => (!query || (n.title + ' ' + n.body).toLocaleLowerCase('pt-BR').includes(query)) && (!$('appFilter').value || n.app === $('appFilter').value) && (!$('statusFilter').value || n.status === $('statusFilter').value));
    $('count').textContent = '(' + notes.length + ')'; $('notes').replaceChildren();
    $('empty').hidden = filtered.length > 0; $('empty').textContent = notes.length ? 'Nenhuma anotação encontrada com esses filtros.' : 'Sua próxima melhoria começa aqui. Crie a primeira anotação.';
    for (const note of filtered) {
      const card = document.createElement('article'); card.className = 'note';
      const meta = document.createElement('div'); meta.className = 'meta';
      for (const value of [note.app, note.status, note.priority]) { const badge = document.createElement('span'); badge.className = 'badge' + (value === 'Alta' ? ' high' : value === 'Concluída' ? ' done' : ''); badge.textContent = value; meta.append(badge); }
      const title = document.createElement('h3'); title.textContent = note.title;
      const body = document.createElement('p'); body.textContent = note.body;
      const footer = document.createElement('footer'); const time = document.createElement('time'); time.dateTime = note.updatedAt; time.textContent = new Date(note.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      const edit = document.createElement('button'); edit.textContent = 'Editar'; edit.onclick = () => openEditor(note); footer.append(time, edit); card.append(meta, title, body, footer); $('notes').append(card);
    }
  }
  async function load() { notes = (await api('')).notes; render(); $('syncStatus').textContent = 'Atualizado online às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '.'; }
  $('loginForm').onsubmit = async event => { event.preventDefault(); token = $('password').value; $('loginButton').disabled = true; $('loginStatus').textContent = 'Entrando…'; try { await load(); $('password').value = ''; $('loginPanel').hidden = true; $('workspace').hidden = false; $('logout').hidden = false; $('loginStatus').textContent = ''; } catch (error) { token = ''; $('loginStatus').textContent = error.message; } finally { $('loginButton').disabled = false; } };
  function openEditor(note = null) {
    editing = note ? { ...note } : null;
    $('editorTitle').textContent = note ? 'Editar anotação' : 'Nova anotação';
    for (const [id, value] of Object.entries({ title: note?.title || '', app: note?.app || 'Geral', priority: note?.priority || 'Normal', noteStatus: note?.status || 'Pendente', body: note?.body || '' })) $(id).value = value;
    $('deleteNote').hidden = !note; $('editorStatus').textContent = ''; $('editor').showModal(); $('title').focus();
  }
  const dirty = () => $('title').value !== (editing?.title || '') || $('body').value !== (editing?.body || '') || $('app').value !== (editing?.app || 'Geral') || $('priority').value !== (editing?.priority || 'Normal') || $('noteStatus').value !== (editing?.status || 'Pendente');
  function closeEditor() { if (!busy && (!dirty() || confirm('Descartar as alterações que ainda não foram salvas?'))) $('editor').close(); }
  $('closeEditor').onclick = $('cancelEditor').onclick = closeEditor;
  $('editor').addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
  function setBusy(value) { busy = value; for (const control of $('noteForm').elements) control.disabled = value; $('saveNote').textContent = value ? 'Salvando…' : 'Salvar online'; }
  async function mutate(remove = false) {
    if (busy) return;
    setBusy(true); $('editorStatus').textContent = '';
    const payload = { title: $('title').value.trim(), body: $('body').value, app: $('app').value, priority: $('priority').value, status: $('noteStatus').value, revision: editing?.revision };
    try {
      const data = await api(editing ? '/' + editing.id : '', { method: remove ? 'DELETE' : editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      notes = notes.filter(n => n.id !== (editing?.id || data.note?.id)); if (data.note) notes.unshift(data.note); notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); render(); $('syncStatus').textContent = remove ? 'Anotação excluída online.' : 'Anotação salva online.'; $('editor').close();
    } catch (error) { $('editorStatus').textContent = error.status === 409 ? 'Esta anotação mudou em outro dispositivo. Seu texto permanece aqui: copie-o antes de fechar, atualize a lista e abra a versão mais recente.' : error.message; }
    finally { setBusy(false); }
  }
  $('noteForm').onsubmit = event => { event.preventDefault(); mutate(); };
  $('deleteNote').onclick = () => { if (confirm('Excluir esta anotação definitivamente?')) mutate(true); };
  $('newNote').onclick = () => openEditor();
  $('refresh').onclick = async () => { $('refresh').disabled = true; try { await load(); } catch (error) { $('syncStatus').textContent = error.message; } finally { $('refresh').disabled = false; } };
  for (const id of ['search', 'appFilter', 'statusFilter']) $(id).addEventListener('input', render);
  $('logout').onclick = () => { token = ''; notes = []; editing = null; $('notes').replaceChildren(); $('workspace').hidden = true; $('logout').hidden = true; $('loginPanel').hidden = false; $('password').focus(); };
  window.addEventListener('beforeunload', event => { if (busy || ($('editor').open && dirty())) { event.preventDefault(); event.returnValue = ''; } });
})();
