import { Router } from "express";
import { eq, and, inArray, lte, gte, sql } from "drizzle-orm";
import { db, certificationsTable, staffTable, locationsTable, certificationTypesTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import {
  CreateCertificationBody,
  UpdateCertificationBody,
  UpdateCertificationParams,
  DeleteCertificationParams,
  GetStaffCertificationsParams,
  ListCertificationsQueryParams,
  ListExpiringCertificationsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// Helper: get location IDs for user
async function getUserLocationIds(userId: string): Promise<number[]> {
  const locs = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.clerkUserId, userId));
  return locs.map((l) => l.id);
}

// Helper: compute cert status
function computeStatus(expirationDate: string | null): {
  status: "valid" | "expiring" | "expired" | "no_expiry";
  daysUntilExpiration: number | null;
} {
  if (!expirationDate) return { status: "no_expiry", daysUntilExpiration: null };

  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: "expired", daysUntilExpiration: diffDays };
  if (diffDays <= 30) return { status: "expiring", daysUntilExpiration: diffDays };
  return { status: "valid", daysUntilExpiration: diffDays };
}

// Build a full certification response with joined data
async function buildCertResponse(certId: number) {
  const [row] = await db
    .select({
      id: certificationsTable.id,
      staffId: certificationsTable.staffId,
      certificationTypeId: certificationsTable.certificationTypeId,
      certificationTypeName: certificationTypesTable.name,
      staffFirstName: staffTable.firstName,
      staffLastName: staffTable.lastName,
      locationId: staffTable.locationId,
      locationName: locationsTable.name,
      issuedDate: certificationsTable.issuedDate,
      expirationDate: certificationsTable.expirationDate,
      notes: certificationsTable.notes,
      createdAt: certificationsTable.createdAt,
      updatedAt: certificationsTable.updatedAt,
    })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .innerJoin(locationsTable, eq(staffTable.locationId, locationsTable.id))
    .innerJoin(certificationTypesTable, eq(certificationsTable.certificationTypeId, certificationTypesTable.id))
    .where(eq(certificationsTable.id, certId));

  if (!row) return null;

  const { status, daysUntilExpiration } = computeStatus(row.expirationDate);
  return { ...row, status, daysUntilExpiration };
}

// List certifications with filters
router.get("/certifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const queryParams = ListCertificationsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (locationIds.length === 0) {
    res.json([]);
    return;
  }

  const { staffId, locationId } = queryParams.data;
  const targetLocationIds = locationId ? [locationId] : locationIds;

  const rows = await db
    .select({
      id: certificationsTable.id,
      staffId: certificationsTable.staffId,
      certificationTypeId: certificationsTable.certificationTypeId,
      certificationTypeName: certificationTypesTable.name,
      staffFirstName: staffTable.firstName,
      staffLastName: staffTable.lastName,
      locationId: staffTable.locationId,
      locationName: locationsTable.name,
      issuedDate: certificationsTable.issuedDate,
      expirationDate: certificationsTable.expirationDate,
      notes: certificationsTable.notes,
      createdAt: certificationsTable.createdAt,
      updatedAt: certificationsTable.updatedAt,
    })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .innerJoin(locationsTable, eq(staffTable.locationId, locationsTable.id))
    .innerJoin(certificationTypesTable, eq(certificationsTable.certificationTypeId, certificationTypesTable.id))
    .where(
      and(
        inArray(staffTable.locationId, targetLocationIds),
        staffId ? eq(certificationsTable.staffId, staffId) : undefined,
      )
    )
    .orderBy(certificationsTable.expirationDate);

  const withStatus = rows.map((row) => {
    const { status, daysUntilExpiration } = computeStatus(row.expirationDate);
    return { ...row, status, daysUntilExpiration };
  });

  const { status } = queryParams.data;
  const filtered = status ? withStatus.filter((c) => c.status === status) : withStatus;

  res.json(filtered);
});

// Get all certifications for a specific staff member
router.get("/staff/:id/certifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = GetStaffCertificationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  const [staffMember] = await db
    .select()
    .from(staffTable)
    .where(
      and(
        eq(staffTable.id, params.data.id),
        inArray(staffTable.locationId, locationIds)
      )
    );

  if (!staffMember) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  const rows = await db
    .select({
      id: certificationsTable.id,
      staffId: certificationsTable.staffId,
      certificationTypeId: certificationsTable.certificationTypeId,
      certificationTypeName: certificationTypesTable.name,
      staffFirstName: staffTable.firstName,
      staffLastName: staffTable.lastName,
      locationId: staffTable.locationId,
      locationName: locationsTable.name,
      issuedDate: certificationsTable.issuedDate,
      expirationDate: certificationsTable.expirationDate,
      notes: certificationsTable.notes,
      createdAt: certificationsTable.createdAt,
      updatedAt: certificationsTable.updatedAt,
    })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .innerJoin(locationsTable, eq(staffTable.locationId, locationsTable.id))
    .innerJoin(certificationTypesTable, eq(certificationsTable.certificationTypeId, certificationTypesTable.id))
    .where(eq(certificationsTable.staffId, params.data.id));

  const withStatus = rows.map((row) => {
    const { status, daysUntilExpiration } = computeStatus(row.expirationDate);
    return { ...row, status, daysUntilExpiration };
  });

  res.json(withStatus);
});

// Create a certification
router.post("/certifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const parsed = CreateCertificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  const [staff] = await db
    .select()
    .from(staffTable)
    .where(
      and(
        eq(staffTable.id, parsed.data.staffId),
        inArray(staffTable.locationId, locationIds)
      )
    );

  if (!staff) {
    res.status(400).json({ error: "Staff member not found or not owned by user" });
    return;
  }

  const [cert] = await db
    .insert(certificationsTable)
    .values(parsed.data)
    .returning();

  const full = await buildCertResponse(cert.id);
  res.status(201).json(full);
});

// Update a certification
router.patch("/certifications/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = UpdateCertificationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCertificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);

  // Verify ownership through staff->location
  const [existing] = await db
    .select({ id: certificationsTable.id })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .where(
      and(
        eq(certificationsTable.id, params.data.id),
        inArray(staffTable.locationId, locationIds)
      )
    );

  if (!existing) {
    res.status(404).json({ error: "Certification not found" });
    return;
  }

  await db
    .update(certificationsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(certificationsTable.id, params.data.id));

  const full = await buildCertResponse(params.data.id);
  res.json(full);
});

// Delete a certification
router.delete("/certifications/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = DeleteCertificationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);

  const [existing] = await db
    .select({ id: certificationsTable.id })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .where(
      and(
        eq(certificationsTable.id, params.data.id),
        inArray(staffTable.locationId, locationIds)
      )
    );

  if (!existing) {
    res.status(404).json({ error: "Certification not found" });
    return;
  }

  await db.delete(certificationsTable).where(eq(certificationsTable.id, params.data.id));
  res.sendStatus(204);
});

// List expiring certifications (within daysAhead days)
router.get("/expiring-certifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const queryParams = ListExpiringCertificationsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (locationIds.length === 0) {
    res.json([]);
    return;
  }

  const { locationId, daysAhead = 30 } = queryParams.data;
  const targetLocationIds = locationId ? [locationId] : locationIds;

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + (daysAhead ?? 30));

  const nowStr = now.toISOString().split("T")[0];
  const futureStr = future.toISOString().split("T")[0];

  const rows = await db
    .select({
      id: certificationsTable.id,
      staffId: certificationsTable.staffId,
      certificationTypeId: certificationsTable.certificationTypeId,
      certificationTypeName: certificationTypesTable.name,
      staffFirstName: staffTable.firstName,
      staffLastName: staffTable.lastName,
      locationId: staffTable.locationId,
      locationName: locationsTable.name,
      issuedDate: certificationsTable.issuedDate,
      expirationDate: certificationsTable.expirationDate,
      notes: certificationsTable.notes,
      createdAt: certificationsTable.createdAt,
      updatedAt: certificationsTable.updatedAt,
    })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .innerJoin(locationsTable, eq(staffTable.locationId, locationsTable.id))
    .innerJoin(certificationTypesTable, eq(certificationsTable.certificationTypeId, certificationTypesTable.id))
    .where(
      and(
        inArray(staffTable.locationId, targetLocationIds),
        gte(certificationsTable.expirationDate, nowStr),
        lte(certificationsTable.expirationDate, futureStr),
      )
    )
    .orderBy(certificationsTable.expirationDate);

  const withStatus = rows.map((row) => {
    const { status, daysUntilExpiration } = computeStatus(row.expirationDate);
    return { ...row, status, daysUntilExpiration };
  });

  res.json(withStatus);
});

export default router;
