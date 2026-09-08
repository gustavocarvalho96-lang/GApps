"use client";

import { useEffect, useMemo, useState } from "react";

type Shift = "" | "Chefe PAC D" | "Chefe PAC N" | "Chefe PAH D" | "Chefe PAH N" | "Chefe Ponte" | "Chefe Retiro" | "CL D" | "CL N" | "CL 10-22h";
type DayEntry = { shifts: Exclude<Shift, "">[] };
type MonthData = Record<number, DayEntry>;

const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const SHIFTS: Array<{ name: Exclude<Shift, "">; rate: number; tone: string }> = [
  { name: "Chefe PAC D", rate: 1300, tone: "chefe-pac-d" },
  { name: "Chefe PAC N", rate: 1300, tone: "chefe-pac-n" },
  { name: "Chefe PAH D", rate: 1300, tone: "chefe-pah-d" },
  { name: "Chefe PAH N", rate: 1300, tone: "chefe-pah-n" },
  { name: "Chefe Ponte", rate: 1300, tone: "chefe-ponte" },
  { name: "Chefe Retiro", rate: 1300, tone: "chefe-retiro" },
  { name: "CL D", rate: 1300, tone: "cl-d" },
  { name: "CL N", rate: 1300, tone: "cl-n" },
  { name: "CL 10-22h", rate: 1300, tone: "cl-10-22h" },
];
const ACCESS_TOKEN_KEY = "gapps-calendario-cloudflare-token-v1";

function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  let token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    token = window.prompt("Digite o código de acesso do calendário:")?.trim() ?? "";
    if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
  if (!token) return Promise.reject(new Error("Acesso cancelado"));

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers }).then((response) => {
    if (response.status === 401) window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    return response;
  });
}

function normalizeEntries(value: unknown): MonthData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const valid = new Set(SHIFTS.map((item) => item.name));
  const output: MonthData = {};
  for (const [rawDay, rawEntry] of Object.entries(value)) {
    const day = Number(rawDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) continue;
    if (typeof rawEntry === "string") {
      if (rawEntry === "PAC N" || rawEntry === "Chefe PAC") output[day] = { shifts: ["Chefe PAC N"] };
      else if (rawEntry === "PAC 24H") output[day] = { shifts: ["Chefe PAC D", "Chefe PAC N"] };
      else if (rawEntry === "CL 24H") output[day] = { shifts: ["CL D", "CL N"] };
      else if (rawEntry === "Chefe PAH") output[day] = { shifts: ["Chefe PAH N"] };
      else if (valid.has(rawEntry as Exclude<Shift, "">)) output[day] = { shifts: [rawEntry as Exclude<Shift, "">] };
      else if (rawEntry === "") output[day] = { shifts: [] };
    } else if (rawEntry && typeof rawEntry === "object") {
      const candidate = rawEntry as { shift?: unknown; dayNight?: unknown; shifts?: unknown };
      if (Array.isArray(candidate.shifts)) {
        const migrated = candidate.shifts.flatMap((item) => {
          if (item === "CL 24H") return ["CL D", "CL N"];
          if (item === "Chefe PAH") return ["Chefe PAH N"];
          return typeof item === "string" && valid.has(item as Exclude<Shift, "">) ? [item as Exclude<Shift, "">] : [];
        });
        output[day] = { shifts: [...new Set(migrated)].slice(0, 2) };
      } else if (candidate.shift === "Chefe PAC") {
        output[day] = { shifts: candidate.dayNight ? ["Chefe PAC D", "Chefe PAC N"] : ["Chefe PAC N"] };
      } else if (typeof candidate.shift === "string" && valid.has(candidate.shift as Exclude<Shift, "">)) {
        output[day] = { shifts: [candidate.shift as Exclude<Shift, "">] };
      } else if (candidate.shift === "") output[day] = { shifts: [] };
    }
  }
  return output;
}

function storageKey(year: number, month: number) {
  return `plantoes:${year}-${String(month + 1).padStart(2, "0")}`;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<MonthData>({});
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"loading" | "saved" | "saving" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    const monthKey = storageKey(year, month).replace("plantoes:", "");
    setLoaded(false);
    setSyncStatus("loading");
    authenticatedFetch(`/api/schedules?month=${monthKey}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar");
        return response.json();
      })
      .then((data) => {
        const onlineEntries = normalizeEntries(data.entries);
        const legacySaved = window.localStorage.getItem(storageKey(year, month));
        const legacyEntries = normalizeEntries(legacySaved ? JSON.parse(legacySaved) : {});
        setEntries(Object.keys(onlineEntries).length ? onlineEntries : legacyEntries);
        setLoaded(true);
        setSyncStatus("saved");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setSyncStatus("error");
      });
    return () => controller.abort();
  }, [year, month]);

  useEffect(() => {
    if (!loaded) return;
    setSyncStatus("saving");
    const monthKey = storageKey(year, month).replace("plantoes:", "");
    const timer = window.setTimeout(() => {
      authenticatedFetch("/api/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthKey, entries }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Falha ao salvar");
          window.localStorage.removeItem(storageKey(year, month));
          setSyncStatus("saved");
        })
        .catch(() => setSyncStatus("error"));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [entries, loaded, month, year]);

  const calendar = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    const firstMondayBased = (new Date(year, month, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstMondayBased + 1;
      return day >= 1 && day <= days ? day : null;
    });
  }, [month, year]);

  const summary = useMemo(() => SHIFTS.map((shift) => {
    const count = Object.values(entries).reduce((sum, entry) => sum + entry.shifts.filter((name) => name === shift.name).length, 0);
    return { ...shift, count, subtotal: count * shift.rate };
  }), [entries]);
  const total = summary.reduce((sum, item) => sum + item.subtotal, 0);
  const shiftsCount = summary.reduce((sum, item) => sum + item.count, 0);

  function moveMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setLoaded(false);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function setShift(day: number, slot: 0 | 1, value: Shift) {
    setEntries((current) => {
      const next = [...(current[day]?.shifts ?? [])];
      if (value) next[slot] = value as Exclude<Shift, "">;
      else next.splice(slot, 1);

      const shifts = next
        .filter((name, index, list) => Boolean(name) && list.indexOf(name) === index)
        .slice(0, 2);

      return { ...current, [day]: { shifts } };
    });
  }

  function applyBaseSchedule() {
    const next: MonthData = {};
    calendar.forEach((day, index) => {
      if (!day) return;
      const weekday = index % 7;
      if (weekday === 1) next[day] = { shifts: ["Chefe PAC N"] };
      if (weekday === 2 || weekday === 5) next[day] = { shifts: ["CL D", "CL N"] };
    });
    setEntries(next);
  }

  function clearMonth() {
    const cleared: MonthData = {};
    calendar.forEach((day) => {
      if (day) cleared[day] = { shifts: [] };
    });
    setEntries(cleared);
  }

  function exportCsv() {
    const rows = [["Data", "Dia da semana", "Plantão", "Valor"]];
    calendar.forEach((day, index) => {
      const entry = day ? entries[day] : undefined;
      if (!day || !entry?.shifts.length) return;
      entry.shifts.forEach((shiftName) => {
        const shift = SHIFTS.find((item) => item.name === shiftName);
        rows.push([
          `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`,
          WEEKDAYS[index % 7],
          shiftName,
          String(shift?.rate ?? 0),
        ]);
      });
    });
    const csv = "\ufeff" + rows.map((row) => row.map((cell) => `"${cell}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `plantoes-${year}-${String(month + 1).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>Plantões</strong>
            <span>Calendário e controle mensal</span>
          </div>
        </div>
        <button className="export-button" onClick={exportCsv} disabled={!shiftsCount}>
          Exportar CSV
        </button>
      </header>

      <section className="intro">
        <div className="month-total">
          <span>Total previsto</span>
          <strong>{money(total)}</strong>
          <small>{shiftsCount} {shiftsCount === 1 ? "plantão lançado" : "plantões lançados"}</small>
        </div>
      </section>

      <section className="workspace">
        <div className="calendar-panel">
          <div className="calendar-toolbar">
            <div className="month-navigation">
              <button aria-label="Mês anterior" onClick={() => moveMonth(-1)}>←</button>
              <div className="month-selectors">
                <select aria-label="Mês" value={month} onChange={(event) => {
                  setLoaded(false);
                  setMonth(Number(event.target.value));
                }}>
                  {MONTHS.map((name, index) => <option value={index} key={name}>{name}</option>)}
                </select>
                <input
                  aria-label="Ano"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(event) => {
                    setLoaded(false);
                    setYear(Number(event.target.value));
                  }}
                />
              </div>
              <button aria-label="Próximo mês" onClick={() => moveMonth(1)}>→</button>
            </div>
            <div className="calendar-actions">
              <button className="subtle-button" onClick={applyBaseSchedule}>Aplicar escala-base</button>
              <button className="text-button" onClick={clearMonth} disabled={!shiftsCount}>Limpar mês</button>
            </div>
          </div>

          <div className="calendar-grid weekday-row">
            {WEEKDAYS.map((day) => <div key={day}>{day.slice(0, 3)}</div>)}
          </div>
          <div className="calendar-grid days-grid">
            {calendar.map((day, index) => {
              const entry = day ? entries[day] ?? { shifts: [] } : { shifts: [] };
              const firstTone = SHIFTS.find((item) => item.name === entry.shifts[0])?.tone ?? "";
              const secondTone = SHIFTS.find((item) => item.name === entry.shifts[1])?.tone ?? "";
              const isDouble = entry.shifts.length > 1;
              return (
                <div className={`day-card ${!day ? "empty" : ""} ${isDouble ? "double-shift" : firstTone}`} key={index}>
                  {day && (
                    <>
                      <span className="day-number">{day}</span>
                      <div className={`shift-stack ${isDouble ? "is-double" : ""}`}>
                        <div className={`shift-slot first-shift ${isDouble ? firstTone : ""}`}>
                          <select
                            aria-label={`Plantão do dia ${day}`}
                            value={entry.shifts[0] ?? ""}
                            onChange={(event) => setShift(day, 0, event.target.value as Shift)}
                          >
                            <option value="">Sem plantão</option>
                            {SHIFTS.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}
                          </select>
                        </div>
                        <div className={`shift-slot second-shift ${isDouble ? secondTone : ""}`}>
                          <select
                            aria-label={`Segundo plantão do dia ${day}`}
                            value={entry.shifts[1] ?? ""}
                            onChange={(event) => setShift(day, 1, event.target.value as Shift)}
                          >
                            <option value=""></option>
                            {SHIFTS.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="summary-panel">
          <div>
            <span className="eyebrow">Resumo do mês</span>
            <h2>{MONTHS[month]} <span>{year}</span></h2>
          </div>
          <div className="summary-list">
            {summary.filter((item) => item.count > 0).map((item) => (
              <div className="summary-row" key={item.name}>
                <span className={`shift-dot ${item.tone}`} />
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.count} × {money(item.rate)}</small>
                </div>
                <b>{money(item.subtotal)}</b>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <p className={`save-note ${syncStatus}`}>
            <span>{syncStatus === "error" ? "!" : syncStatus === "saving" || syncStatus === "loading" ? "↻" : "✓"}</span>
            {syncStatus === "loading" && " Carregando dados online"}
            {syncStatus === "saving" && " Salvando online"}
            {syncStatus === "saved" && " Sincronizado entre seus dispositivos"}
            {syncStatus === "error" && " Não foi possível sincronizar"}
          </p>
        </aside>
      </section>
    </main>
  );
}
