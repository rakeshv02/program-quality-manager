import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, locationsTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { getUserPlan, FREE_TIER_LOCATION_LIMIT } from "../lib/plan";
import {
  CreateLocationBody,
  UpdateLocationBody,
  GetLocationParams,
  UpdateLocationParams,
  DeleteLocationParams,
} from "@workspace/api-zod";

const router = Router();

// List all locations for the authenticated user
router.get("/locations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const locations = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.clerkUserId, userId))
    .orderBy(locationsTable.name);
  res.json(locations);
});

// Create a new location (free tier: 2 max)
router.post("/locations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const plan = await getUserPlan(userId);
  if (plan !== "pro") {
    const existing = await db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.clerkUserId, userId));

    if (existing.length >= FREE_TIER_LOCATION_LIMIT) {
      res.status(403).json({ error: "Free tier limit reached. Upgrade to Pro to add more than 2 locations." });
      return;
    }
  }

  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [location] = await db
    .insert(locationsTable)
    .values({ ...parsed.data, clerkUserId: userId })
    .returning();

  res.status(201).json(location);
});

// Get a single location
router.get("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = GetLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, params.data.id), eq(locationsTable.clerkUserId, userId)));

  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  res.json(location);
});

// Update a location
router.patch("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = UpdateLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [location] = await db
    .update(locationsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(locationsTable.id, params.data.id), eq(locationsTable.clerkUserId, userId)))
    .returning();

  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  res.json(location);
});

// Delete a location
router.delete("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = DeleteLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [location] = await db
    .delete(locationsTable)
    .where(and(eq(locationsTable.id, params.data.id), eq(locationsTable.clerkUserId, userId)))
    .returning();

  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
