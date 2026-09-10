// Three-way merge: untouched fields follow the server; competing edits require review.
export const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function validTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length > 1000) return false;
  const ids = new Set();
  return (
    tasks.every((task) => {
      if (
        !task ||
        typeof task !== "object" ||
        Array.isArray(task) ||
        typeof task.id !== "string" ||
        !task.id ||
        ids.has(task.id) ||
        typeof task.patient !== "string" ||
        !task.patient.trim() ||
        typeof task.description !== "string" ||
        !task.description.trim() ||
        typeof task.done !== "boolean"
      )
        return false;
      ids.add(task.id);
      return Object.entries(task).every(
        ([key, value]) =>
          !["__proto__", "constructor", "prototype"].includes(key) &&
          ((typeof value === "string" && value.length <= 10000) ||
            typeof value === "boolean" ||
            value === null),
      );
    }) && JSON.stringify(tasks).length <= 900000
  );
}

export function mergeTasks(base, local, remote) {
  const maps = [base, local, remote].map(
    (list) => new Map(list.map((t) => [t.id, t])),
  );
  const result = [],
    conflicts = [];
  for (const id of new Set([
    ...maps[2].keys(),
    ...maps[1].keys(),
    ...maps[0].keys(),
  ])) {
    const [b, l, r] = maps.map((map) => map.get(id));
    if (equal(l, b)) {
      if (r) result.push(r);
      continue;
    }
    if (equal(r, b) || equal(l, r)) {
      if (l) result.push(l);
      continue;
    }
    if (!b || !l || !r) {
      conflicts.push({ id, field: "*", local: l, remote: r });
      if (l) result.push(l);
      continue;
    }
    const merged = { ...r };
    for (const field of new Set([
      ...Object.keys(b),
      ...Object.keys(l),
      ...Object.keys(r),
    ])) {
      if (equal(l[field], b[field])) continue;
      if (!equal(r[field], b[field]) && !equal(l[field], r[field])) {
        conflicts.push({
          id,
          field,
          local: l[field],
          remote: r[field],
          patient: l.patient,
        });
      }
      if (l[field] === undefined) delete merged[field];
      else merged[field] = l[field];
    }
    result.push(merged);
  }
  return { tasks: result, conflicts };
}
