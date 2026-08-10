import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { locationsTable } from "./locations";

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locationsTable.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  hireDate: date("hire_date", { mode: "string" }),
  yearsExperience: integer("years_experience"),
  annualTrainingHours: integer("annual_training_hours").notNull().default(0),
  preserviceHours: integer("preservice_hours").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffSchema = createInsertSchema(staffTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staffTable.$inferSelect;
