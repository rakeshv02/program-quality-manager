import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { staffTable } from "./staff";
import { certificationTypesTable } from "./certificationTypes";

export const certificationsTable = pgTable("certifications", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  certificationTypeId: integer("certification_type_id").notNull().references(() => certificationTypesTable.id),
  issuedDate: date("issued_date", { mode: "string" }),
  expirationDate: date("expiration_date", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCertificationSchema = createInsertSchema(certificationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certificationsTable.$inferSelect;
