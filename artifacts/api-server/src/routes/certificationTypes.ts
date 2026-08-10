import { Router } from "express";
import { db, certificationTypesTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { CreateCertificationTypeBody } from "@workspace/api-zod";

const router = Router();

// List all certification types (global defaults + any user-created)
router.get("/certification-types", requireAuth, async (_req, res): Promise<void> => {
  const types = await db
    .select()
    .from(certificationTypesTable)
    .orderBy(certificationTypesTable.name);
  res.json(types);
});

// Create a custom certification type
router.post("/certification-types", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCertificationTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [certType] = await db
    .insert(certificationTypesTable)
    .values({ ...parsed.data, isDefault: false })
    .returning();

  res.status(201).json(certType);
});

export default router;
