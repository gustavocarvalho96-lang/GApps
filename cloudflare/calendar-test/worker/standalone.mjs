const SHIFTS = ["Chefe PAC D", "Chefe PAC N", "Chefe PAH D", "Chefe PAH N", "Chefe Ponte", "Chefe Retiro", "CL D", "CL N", "CL 10-22h"];
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

function sanitizeEntries(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const valid = new Set(SHIFTS);
  const output = {};
  for (const [rawDay, rawEntry] of Object.entries(value)) {
    const day = Number(rawDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) continue;
    if (typeof rawEntry === "string") {
      if (rawEntry === "PAC N" || rawEntry === "Chefe PAC") output[day] = { shifts: ["Chefe PAC N"] };
      else if (rawEntry === "PAC 24H") output[day] = { shifts: ["Chefe PAC D", "Chefe PAC N"] };
      else if (rawEntry === "CL 24H") output[day] = { shifts: ["CL D", "CL N"] };
      else if (rawEntry === "Chefe PAH") output[day] = { shifts: ["Chefe PAH N"] };
      else if (valid.has(rawEntry)) output[day] = { shifts: [rawEntry] };
      else if (rawEntry === "") output[day] = { shifts: [] };
    } else if (rawEntry && typeof rawEntry === "object") {
      const values = Array.isArray(rawEntry.shifts) ? rawEntry.shifts : [];
      const migrated = values.flatMap((item) => item === "CL 24H" ? ["CL D", "CL N"] : item === "Chefe PAH" ? ["Chefe PAH N"] : valid.has(item) ? [item] : []);
      output[day] = { shifts: [...new Set(migrated)].slice(0, 2) };
    }
  }
  return output;
}

async function authorized(request, env) {
  const provided = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!provided || !env.CALENDAR_TOKEN) return false;
  const bytes = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", bytes.encode(provided)),
    crypto.subtle.digest("SHA-256", bytes.encode(env.CALENDAR_TOKEN)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) difference |= a[i] ^ b[i];
  return difference === 0;
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function schedules(request, env) {
  if (!(await authorized(request, env))) return json({ error: "Código de acesso inválido" }, 401);
  if (request.method === "GET") {
    const month = new URL(request.url).searchParams.get("month");
    if (!month || !MONTH_KEY.test(month)) return json({ error: "Mês inválido" }, 400);
    const rows = await env.DB.prepare("SELECT user_email, entries_json FROM monthly_schedules WHERE month_key = ? AND user_email IN ('owner', '__excel_seed__')")
      .bind(month).all();
    let seed = {};
    let owner = {};
    for (const row of rows.results || []) {
      const parsed = sanitizeEntries(JSON.parse(row.entries_json || "{}"));
      if (row.user_email === "owner") owner = parsed;
      else seed = parsed;
    }
    return json({ entries: { ...seed, ...owner } });
  }
  if (request.method === "PUT") {
    const payload = await request.json();
    if (!payload.month || !MONTH_KEY.test(payload.month)) return json({ error: "Mês inválido" }, 400);
    const entries = JSON.stringify(sanitizeEntries(payload.entries));
    await env.DB.prepare("INSERT INTO monthly_schedules (user_email, month_key, entries_json, updated_at) VALUES ('owner', ?, ?, ?) ON CONFLICT(user_email, month_key) DO UPDATE SET entries_json = excluded.entries_json, updated_at = excluded.updated_at")
      .bind(payload.month, entries, Date.now()).run();
    return json({ saved: true });
  }
  return json({ error: "Método não permitido" }, 405);
}

const HTML = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plantões — Calendário mensal</title><meta name="description" content="Calendário mensal de plantões com sincronização online.">
<style>
:root{--ink:#18251f;--muted:#69756f;--paper:#f7f6ef;--surface:#fff;--line:#e1e4de;--green:#1d6b4f;--green-soft:#e8f2ec;--yellow:#f2d45c;--shadow:0 24px 70px rgba(29,48,39,.1)}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 82% 5%,rgba(242,212,92,.23),transparent 25rem),var(--paper);color:var(--ink);font-family:Arial,sans-serif}button,select,input{font:inherit}button,select{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}main{min-height:100vh}.topbar{height:78px;padding:0 clamp(22px,5vw,76px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(24,37,31,.09);background:rgba(247,246,239,.78);backdrop-filter:blur(14px)}.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:var(--green);color:#fff;font-weight:800}.brand div{display:grid}.brand strong{font-size:16px}.brand span:last-child{font-size:12px;color:var(--muted);margin-top:2px}.export-button,.subtle-button,.text-button{border:0;border-radius:10px;transition:transform .15s ease,background .15s ease}.export-button{padding:11px 17px;background:var(--ink);color:#fff;font-weight:650}.export-button:hover,.subtle-button:hover{transform:translateY(-1px)}.intro{padding:30px clamp(22px,5vw,76px) 24px;display:flex;justify-content:flex-end}.month-total{min-width:230px;padding:21px 23px;border-left:3px solid var(--yellow);display:grid}.month-total span{font-size:12px;color:var(--muted)}.month-total strong{font-size:31px;letter-spacing:-.04em;margin:4px 0}.month-total small{color:var(--green);font-weight:650}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:20px;padding:0 clamp(22px,5vw,76px) 70px}.calendar-panel,.summary-panel{background:var(--surface);border:1px solid rgba(24,37,31,.08);border-radius:18px;box-shadow:var(--shadow)}.calendar-panel{padding:22px;overflow:hidden}.calendar-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:20px}.month-navigation{display:flex;align-items:center;gap:10px}.month-navigation>button{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink)}.month-selectors{display:flex}.month-selectors select,.month-selectors input{height:38px;border:1px solid var(--line);background:#fbfcfa;font-weight:700;color:var(--ink)}.month-selectors select{width:130px;padding:0 10px;border-radius:10px 0 0 10px}.month-selectors input{width:80px;padding:0 8px;border-left:0;border-radius:0 10px 10px 0}.calendar-actions{display:flex;gap:8px}.subtle-button{padding:10px 13px;background:var(--green-soft);color:var(--green);font-weight:700}.text-button{padding:10px;background:transparent;color:var(--muted)}.calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.weekday-row{border-bottom:1px solid var(--line)}.weekday-row div{padding:10px 8px;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.days-grid{gap:7px;padding-top:8px}.day-card{position:relative;min-height:92px;padding:10px;border:1px solid var(--line);border-radius:11px;background:#fdfdfb;display:flex;flex-direction:column;justify-content:space-between;transition:border-color .15s ease,transform .15s ease}.day-card:not(.empty):hover{border-color:#a9b8af;transform:translateY(-1px)}.day-card.empty{background:#faf9f4;border-color:transparent}.day-number{font-size:13px;font-weight:750}.day-card select{width:100%;border:0;background:transparent;color:var(--ink);font-size:11px;font-weight:750;outline:none}.shift-stack{display:grid;gap:3px;margin-top:auto}.day-card.chefe-pac-d,.shift-slot.chefe-pac-d{background:#f8edb3;border-color:#ddc75d}.day-card.chefe-pac-n,.shift-slot.chefe-pac-n{background:#f4dfaa;border-color:#cfa746}.day-card.chefe-pah-d,.shift-slot.chefe-pah-d{background:#dce8f7;border-color:#8badd4}.day-card.chefe-pah-n,.shift-slot.chefe-pah-n{background:#ccdbee;border-color:#6f95c2}.day-card.chefe-ponte,.shift-slot.chefe-ponte{background:#f4dfd7;border-color:#cf9b88}.day-card.chefe-retiro,.shift-slot.chefe-retiro{background:#fde3c2;border-color:#d89a50}.day-card.cl-d,.shift-slot.cl-d{background:#dcefe5;border-color:#91c0a6}.day-card.cl-n,.shift-slot.cl-n{background:#e8e4f5;border-color:#b4a8dc}.day-card.cl-10-22h,.shift-slot.cl-10-22h{background:#d8f1f4;border-color:#75b9c2}.day-card.double-shift{padding:0;overflow:hidden;background:#fff;border-color:#aeb8b1}.day-card.double-shift .day-number{position:absolute;z-index:2;top:7px;left:9px;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.88)}.day-card.double-shift .shift-stack{height:100%;margin:0;gap:0;grid-template-rows:1fr 1fr}.day-card.double-shift .shift-slot{display:flex;align-items:center;padding:15px 8px 3px}.day-card.double-shift .second-shift{padding:3px 8px 8px;border-top:2px solid rgba(24,37,31,.18)}.day-card.double-shift select{text-align:center;font-size:10px}.summary-panel{padding:26px 23px;display:flex;flex-direction:column}.eyebrow{display:block;color:var(--green);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}.summary-panel h2{margin:0;font-size:26px}.summary-panel h2 span{color:var(--muted);font-weight:400}.summary-list{margin:25px 0;display:grid;gap:4px}.summary-row{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #edf0eb}.shift-dot{width:8px;height:8px;border-radius:50%;background:#4e9c70}.summary-row div{display:grid;gap:2px}.summary-row strong,.summary-row b{font-size:13px}.summary-row small{color:var(--muted);font-size:11px}.summary-total{margin-top:auto;padding:19px 0;display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid var(--ink)}.summary-total strong{font-size:24px}.save-note{margin:0;color:var(--muted);font-size:11px;text-align:center}.save-note.error{color:#a44235}.save-note.loading span,.save-note.saving span{display:inline-block;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:960px){.workspace{grid-template-columns:1fr}.summary-panel{min-height:410px}}@media(max-width:680px){.topbar{height:68px}.brand span:last-child{display:none}.intro{padding-top:20px}.calendar-panel{padding:13px}.calendar-toolbar{align-items:stretch;flex-direction:column}.month-navigation{justify-content:space-between}.calendar-actions{justify-content:space-between}.weekday-row div{text-align:center;padding-inline:1px}.days-grid{gap:4px}.day-card{min-height:75px;padding:7px 5px}.day-card select{font-size:9px}.workspace{padding-inline:10px}}
</style></head><body><main>
<header class="topbar"><div class="brand"><span class="brand-mark">P</span><div><strong>Plantões</strong><span>Calendário e controle mensal</span></div></div><button id="export" class="export-button">Exportar CSV</button></header>
<section class="intro"><div class="month-total"><span>Total previsto</span><strong id="top-total">R$ 0</strong><small id="shift-count">0 plantões lançados</small></div></section>
<section class="workspace"><div class="calendar-panel"><div class="calendar-toolbar"><div class="month-navigation"><button id="prev" aria-label="Mês anterior">←</button><div class="month-selectors"><select id="month" aria-label="Mês"></select><input id="year" aria-label="Ano" type="number" min="2000" max="2100"></div><button id="next" aria-label="Próximo mês">→</button></div><div class="calendar-actions"><button id="base" class="subtle-button">Aplicar escala-base</button><button id="clear" class="text-button">Limpar mês</button></div></div><div class="calendar-grid weekday-row" id="weekdays"></div><div class="calendar-grid days-grid" id="days"></div></div><aside class="summary-panel"><div><span class="eyebrow">Resumo do mês</span><h2 id="summary-title"></h2></div><div class="summary-list" id="summary"></div><div class="summary-total"><span>Total</span><strong id="total">R$ 0</strong></div><p class="save-note loading" id="status"><span>↻</span> Carregando dados online</p></aside></section>
</main><script>
(function(){
const WEEKDAYS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const SHIFTS=[['Chefe PAC D','chefe-pac-d'],['Chefe PAC N','chefe-pac-n'],['Chefe PAH D','chefe-pah-d'],['Chefe PAH N','chefe-pah-n'],['Chefe Ponte','chefe-ponte'],['Chefe Retiro','chefe-retiro'],['CL D','cl-d'],['CL N','cl-n'],['CL 10-22h','cl-10-22h']];
const TOKEN_KEY='gapps-calendario-cloudflare-token-v1';let now=new Date(),year=now.getFullYear(),month=now.getMonth(),entries={},loaded=false,saveTimer;
const $=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n),monthKey=()=>year+'-'+String(month+1).padStart(2,'0');
function token(){let value=localStorage.getItem(TOKEN_KEY);if(!value){value=(prompt('Digite o código de acesso do calendário:')||'').trim();if(value)localStorage.setItem(TOKEN_KEY,value)}return value}
async function api(url,options={}){const value=token();if(!value)throw new Error('Acesso cancelado');const headers=new Headers(options.headers);headers.set('Authorization','Bearer '+value);const response=await fetch(url,{...options,headers});if(response.status===401){localStorage.removeItem(TOKEN_KEY);alert('Código incorreto. Abra novamente e digite o código de acesso.')}return response}
function normalize(value){if(!value||typeof value!=='object'||Array.isArray(value))return{};const names=new Set(SHIFTS.map(x=>x[0])),out={};for(const [key,item] of Object.entries(value)){const day=Number(key);if(day<1||day>31)continue;if(typeof item==='string'){if(item==='PAC N'||item==='Chefe PAC')out[day]={shifts:['Chefe PAC N']};else if(item==='PAC 24H')out[day]={shifts:['Chefe PAC D','Chefe PAC N']};else if(item==='CL 24H')out[day]={shifts:['CL D','CL N']};else if(item==='Chefe PAH')out[day]={shifts:['Chefe PAH N']};else if(names.has(item))out[day]={shifts:[item]};}else if(item&&Array.isArray(item.shifts)){out[day]={shifts:[...new Set(item.shifts.flatMap(x=>x==='CL 24H'?['CL D','CL N']:x==='Chefe PAH'?['Chefe PAH N']:names.has(x)?[x]:[]))].slice(0,2)}}}return out}
function calendar(){const count=new Date(year,month+1,0).getDate(),offset=(new Date(year,month,1).getDay()+6)%7;return Array.from({length:42},(_,i)=>{const day=i-offset+1;return day>=1&&day<=count?day:null})}
function optionList(empty){return '<option value="">'+(empty?'':'Sem plantão')+'</option>'+SHIFTS.map(x=>'<option value="'+x[0]+'">'+x[0]+'</option>').join('')}
function render(){ $('month').value=month;$('year').value=year;$('summary-title').innerHTML=MONTHS[month]+' <span>'+year+'</span>';const cal=calendar();$('days').innerHTML=cal.map((day,index)=>{if(!day)return'<div class="day-card empty"></div>';const shifts=(entries[day]||{shifts:[]}).shifts;const tones=shifts.map(name=>(SHIFTS.find(x=>x[0]===name)||['',''])[1]);const double=shifts.length>1;return '<div class="day-card '+(double?'double-shift':tones[0]||'')+'"><span class="day-number">'+day+'</span><div class="shift-stack"><div class="shift-slot first-shift '+(double?tones[0]||'':'')+'"><select data-day="'+day+'" data-slot="0" aria-label="Plantão do dia '+day+'">'+optionList(false)+'</select></div><div class="shift-slot second-shift '+(double?tones[1]||'':'')+'"><select data-day="'+day+'" data-slot="1" aria-label="Segundo plantão do dia '+day+'">'+optionList(true)+'</select></div></div></div>'}).join('');document.querySelectorAll('#days select').forEach(select=>{const item=entries[Number(select.dataset.day)]||{shifts:[]};select.value=item.shifts[Number(select.dataset.slot)]||'';select.onchange=()=>setShift(Number(select.dataset.day),Number(select.dataset.slot),select.value)});renderSummary()}
function renderSummary(){const summary=SHIFTS.map(item=>{const count=Object.values(entries).reduce((sum,e)=>sum+(e.shifts||[]).filter(x=>x===item[0]).length,0);return{name:item[0],tone:item[1],count,subtotal:count*1300}}),count=summary.reduce((s,x)=>s+x.count,0),total=summary.reduce((s,x)=>s+x.subtotal,0);$('summary').innerHTML=summary.filter(x=>x.count).map(x=>'<div class="summary-row"><span class="shift-dot '+x.tone+'"></span><div><strong>'+x.name+'</strong><small>'+x.count+' × '+money(1300)+'</small></div><b>'+money(x.subtotal)+'</b></div>').join('');$('total').textContent=$('top-total').textContent=money(total);$('shift-count').textContent=count+' '+(count===1?'plantão lançado':'plantões lançados');$('export').disabled=$('clear').disabled=!count}
function status(kind,text,symbol){const el=$('status');el.className='save-note '+kind;el.innerHTML='<span>'+symbol+'</span> '+text}
async function load(){loaded=false;status('loading','Carregando dados online','↻');try{const response=await api('/api/schedules?month='+monthKey());if(!response.ok)throw new Error();entries=normalize((await response.json()).entries);loaded=true;status('saved','Sincronizado entre seus dispositivos','✓');render()}catch(error){status('error','Não foi possível sincronizar','!')}}
function save(){if(!loaded)return;clearTimeout(saveTimer);status('saving','Salvando online','↻');saveTimer=setTimeout(async()=>{try{const response=await api('/api/schedules',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({month:monthKey(),entries})});if(!response.ok)throw new Error();status('saved','Sincronizado entre seus dispositivos','✓')}catch(error){status('error','Não foi possível sincronizar','!')}},450)}
function setShift(day,slot,value){const next=[...((entries[day]||{shifts:[]}).shifts)];if(value)next[slot]=value;else next.splice(slot,1);entries={...entries,[day]:{shifts:next.filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,2)}};render();save()}
function move(delta){const next=new Date(year,month+delta,1);year=next.getFullYear();month=next.getMonth();load()}
$('month').innerHTML=MONTHS.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join('');$('weekdays').innerHTML=WEEKDAYS.map(x=>'<div>'+x.slice(0,3)+'</div>').join('');$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('month').onchange=e=>{month=Number(e.target.value);load()};$('year').onchange=e=>{year=Number(e.target.value);load()};$('base').onclick=()=>{const next={};calendar().forEach((day,i)=>{if(!day)return;const weekday=i%7;if(weekday===1)next[day]={shifts:['Chefe PAC N']};if(weekday===2||weekday===5)next[day]={shifts:['CL D','CL N']}});entries=next;render();save()};$('clear').onclick=()=>{const next={};calendar().forEach(day=>{if(day)next[day]={shifts:[]}});entries=next;render();save()};$('export').onclick=()=>{const rows=[['Data','Dia da semana','Plantão','Valor']];calendar().forEach((day,i)=>{if(!day)return;(entries[day]||{shifts:[]}).shifts.forEach(name=>rows.push([String(day).padStart(2,'0')+'/'+String(month+1).padStart(2,'0')+'/'+year,WEEKDAYS[i%7],name,'1300']))});const csv='\ufeff'+rows.map(row=>row.map(cell=>'"'+cell+'"').join(';')).join('\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='plantoes-'+monthKey()+'.csv';link.click();URL.revokeObjectURL(url)};render();load();
})();
</script></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/schedules") return schedules(request, env);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
    return new Response("Não encontrado", { status: 404 });
  },
};
