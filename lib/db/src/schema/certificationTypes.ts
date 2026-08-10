import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const certificationTypesTable = pgTable("certification_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  validityMonths: integer("validity_months"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCertificationTypeSchema = createInsertSchema(certificationTypesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCertificationType = z.infer<typeof insertCertificationTypeSchema>;
export type CertificationType = typeof certificationTypesTable.$inferSelect;
