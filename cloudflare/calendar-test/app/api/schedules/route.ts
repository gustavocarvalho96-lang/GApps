import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getDb } from "../../../db";
import { monthlySchedules } from "../../../db/schema";

type Shift = "" | "Chefe PAC D" | "Chefe PAC N" | "Chefe PAH D" | "Chefe PAH N" | "Chefe Ponte" | "Chefe Retiro" | "CL D" | "CL N" | "CL 10-22h";
type DayEntry = { shifts: Exclude<Shift, "">[] };
type MonthData = Record<number, DayEntry>;

const VALID_SHIFTS = new Set<Shift>(["", "Chefe PAC D", "Chefe PAC N", "Chefe PAH D", "Chefe PAH N", "Chefe Ponte", "Chefe Retiro", "CL D", "CL N", "CL 10-22h"]);
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
const OWNER_KEY = "owner";

async function isAuthorized() {
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expected = (env as unknown as { CALENDAR_TOKEN?: string }).CALENDAR_TOKEN ?? "";
  if (!provided || !expected) return false;

  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function validMonthKey(value: string | null): value is string {
  return Boolean(value && MONTH_KEY.test(value));
}

function sanitizeEntries(value: unknown): MonthData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: MonthData = {};
  for (const [rawDay, rawEntry] of Object.entries(value)) {
    const day = Number(rawDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) continue;
    if (typeof rawEntry === "string") {
      if (rawEntry === "PAC N" || rawEntry === "Chefe PAC") output[day] = { shifts: ["Chefe PAC N"] };
      else if (rawEntry === "PAC 24H") output[day] = { shifts: ["Chefe PAC D", "Chefe PAC N"] };
      else if (rawEntry === "CL 24H") output[day] = { shifts: ["CL D", "CL N"] };
      else if (rawEntry === "Chefe PAH") output[day] = { shifts: ["Chefe PAH N"] };
      else if (VALID_SHIFTS.has(rawEntry as Shift) && rawEntry) output[day] = { shifts: [rawEntry as Exclude<Shift, "">] };
      else if (rawEntry === "") output[day] = { shifts: [] };
    } else if (rawEntry && typeof rawEntry === "object") {
      const candidate = rawEntry as { shift?: unknown; dayNight?: unknown; shifts?: unknown };
      if (Array.isArray(candidate.shifts)) {
        const migrated = candidate.shifts.flatMap((item) => {
          if (item === "CL 24H") return ["CL D", "CL N"];
          if (item === "Chefe PAH") return ["Chefe PAH N"];
          return typeof item === "string" && VALID_SHIFTS.has(item as Shift) && item !== "" ? [item as Exclude<Shift, "">] : [];
        });
        output[day] = { shifts: [...new Set(migrated)].slice(0, 2) };
      } else if (candidate.shift === "Chefe PAC") {
        output[day] = { shifts: candidate.dayNight ? ["Chefe PAC D", "Chefe PAC N"] : ["Chefe PAC N"] };
      } else if (typeof candidate.shift === "string" && VALID_SHIFTS.has(candidate.shift as Shift) && candidate.shift) {
        output[day] = { shifts: [candidate.shift as Exclude<Shift, "">] };
      } else if (candidate.shift === "") output[day] = { shifts: [] };
    }
  }
  return output;
}

export async function GET(request: Request) {
  if (!(await isAuthorized())) return Response.json({ error: "Código de acesso inválido" }, { status: 401 });

  const monthKey = new URL(request.url).searchParams.get("month");
  if (!validMonthKey(monthKey)) {
    return Response.json({ error: "Mês inválido" }, { status: 400 });
  }

  const db = getDb();
  const [userRow] = await db
    .select({ entriesJson: monthlySchedules.entriesJson })
    .from(monthlySchedules)
    .where(and(
      eq(monthlySchedules.userEmail, OWNER_KEY),
      eq(monthlySchedules.monthKey, monthKey),
    ))
    .limit(1);

  const [seedRow] = await db
    .select({ entriesJson: monthlySchedules.entriesJson })
    .from(monthlySchedules)
    .where(and(
      eq(monthlySchedules.userEmail, "__excel_seed__"),
      eq(monthlySchedules.monthKey, monthKey),
    ))
    .limit(1);

  return Response.json({
    entries: {
      ...(seedRow ? sanitizeEntries(JSON.parse(seedRow.entriesJson)) : {}),
      ...(userRow ? sanitizeEntries(JSON.parse(userRow.entriesJson)) : {}),
    },
  });
}

export async function PUT(request: Request) {
  if (!(await isAuthorized())) return Response.json({ error: "Código de acesso inválido" }, { status: 401 });

  const payload = await request.json() as { month?: string; entries?: unknown };
  if (!validMonthKey(payload.month ?? null)) {
    return Response.json({ error: "Mês inválido" }, { status: 400 });
  }

  const entries = sanitizeEntries(payload.entries);
  const db = getDb();
  await db
    .insert(monthlySchedules)
    .values({
      userEmail: OWNER_KEY,
      monthKey: payload.month!,
      entriesJson: JSON.stringify(entries),
    })
    .onConflictDoUpdate({
      target: [monthlySchedules.userEmail, monthlySchedules.monthKey],
      set: { entriesJson: JSON.stringify(entries), updatedAt: new Date() },
    });

  return Response.json({ saved: true });
}
