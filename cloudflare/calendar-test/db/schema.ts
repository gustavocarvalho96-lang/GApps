import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const monthlySchedules = sqliteTable(
  "monthly_schedules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userEmail: text("user_email").notNull(),
    monthKey: text("month_key").notNull(),
    entriesJson: text("entries_json").notNull().default("{}"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("monthly_schedules_user_month_idx").on(
      table.userEmail,
      table.monthKey,
    ),
  ],
);
