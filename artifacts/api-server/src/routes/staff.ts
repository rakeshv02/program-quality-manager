import { Router } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, staffTable, locationsTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import {
  CreateStaffMemberBody,
  UpdateStaffMemberBody,
  GetStaffMemberParams,
  UpdateStaffMemberParams,
  DeleteStaffMemberParams,
  ListStaffQueryParams,
} from "@workspace/api-zod";

const router = Router();

// Helper: get all location IDs for a user
async function getUserLocationIds(userId: string): Promise<number[]> {
  const locs = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.clerkUserId, userId));
  return locs.map((l) => l.id);
}

// List staff (optionally filtered by location)
router.get("/staff", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const queryParams = ListStaffQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (locationIds.length === 0) {
    res.json([]);
    return;
  }

  const { locationId, status } = queryParams.data;
  const targetIds = locationId ? [locationId] : locationIds;

  let query = db
    .select()
    .from(staffTable)
    .where(inArray(staffTable.locationId, targetIds));

  const staff = await query.orderBy(staffTable.lastName);

  const filtered = status ? staff.filter((s) => s.status === status) : staff;
  res.json(filtered);
});

// Create a new staff member (free tier: 12 max total)
router.post("/staff", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const parsed = CreateStaffMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (!locationIds.includes(parsed.data.locationId)) {
    res.status(403).json({ error: "Location not found or not owned by user" });
    return;
  }

  const existing = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(inArray(staffTable.locationId, locationIds));

  if (existing.length >= 12) {
    res.status(403).json({ error: "Free tier limit reached. Upgrade to Pro to add more than 12 staff members." });
    return;
  }

  const [staff] = await db
    .insert(staffTable)
    .values({ ...parsed.data, status: parsed.data.status ?? "active" })
    .returning();

  res.status(201).json(staff);
});

// Get a single staff member
router.get("/staff/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = GetStaffMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (locationIds.length === 0) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  const [staff] = await db
    .select()
    .from(staffTable)
    .where(
      and(
        eq(staffTable.id, params.data.id),
        inArray(staffTable.locationId, locationIds)
      )
    );

  if (!staff) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.json(staff);
});

// Update a staff member
router.patch("/staff/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = UpdateStaffMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStaffMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (locationIds.length === 0) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  const [staff] = await db
    .update(staffTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(
        eq(staffTable.id, params.data.id),
        inArray(staffTable.locationId, locationIds)
      )
    )
    .returning();

  if (!staff) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.json(staff);
});

// Delete a staff member
router.delete("/staff/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = DeleteStaffMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const locationIds = await getUserLocationIds(userId);
  if (locationIds.length === 0) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  const [staff] = await db
    .delete(staffTable)
    .where(
      and(
        eq(staffTable.id, params.data.id),
        inArray(staffTable.locationId, locationIds)
      )
    )
    .returning();

  if (!staff) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
