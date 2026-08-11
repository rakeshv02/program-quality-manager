import { Router } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, certificationsTable, staffTable, locationsTable, certificationTypesTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { getUserPlan, FREE_TIER_STAFF_LIMIT, FREE_TIER_LOCATION_LIMIT } from "../lib/plan";
import {
  GetDashboardQueryParams,
  GetRisingStarScoreQueryParams,
  ExportCsvQueryParams,
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
function computeStatus(expirationDate: string | null): "valid" | "expiring" | "expired" | "no_expiry" {
  if (!expirationDate) return "no_expiry";
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
}

// Dashboard summary
router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const queryParams = GetDashboardQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const allLocationIds = await getUserLocationIds(userId);
  if (allLocationIds.length === 0) {
    res.json({
      totalStaff: 0,
      compliantStaff: 0,
      expiringSoonStaff: 0,
      expiredCertifications: 0,
      totalCertifications: 0,
      locationBreakdown: [],
      plan: await getUserPlan(userId),
      freeTierUsage: { staffCount: 0, staffLimit: 12, locationCount: 0, locationLimit: 2 },
    });
    return;
  }

  const { locationId } = queryParams.data;
  const targetIds = locationId ? [locationId] : allLocationIds;

  // Get all locations for breakdown
  const locations = await db
    .select()
    .from(locationsTable)
    .where(inArray(locationsTable.id, targetIds));

  // Get all staff in target locations
  const allStaff = await db
    .select()
    .from(staffTable)
    .where(and(inArray(staffTable.locationId, targetIds), eq(staffTable.status, "active")));

  const staffIds = allStaff.map((s) => s.id);

  // Get all certifications
  const certs = staffIds.length > 0
    ? await db
        .select()
        .from(certificationsTable)
        .where(inArray(certificationsTable.staffId, staffIds))
    : [];

  // Compute per-staff compliance status
  const staffCertMap = new Map<number, string[]>();
  for (const cert of certs) {
    const status = computeStatus(cert.expirationDate);
    if (!staffCertMap.has(cert.staffId)) staffCertMap.set(cert.staffId, []);
    staffCertMap.get(cert.staffId)!.push(status);
  }

  let compliantStaff = 0;
  let expiringSoonStaff = 0;

  for (const staff of allStaff) {
    const statuses = staffCertMap.get(staff.id) ?? [];
    if (statuses.some((s) => s === "expired")) continue;
    if (statuses.some((s) => s === "expiring")) {
      expiringSoonStaff++;
    } else {
      compliantStaff++;
    }
  }

  const expiredCertifications = certs.filter((c) => computeStatus(c.expirationDate) === "expired").length;

  // Location breakdown
  const locationBreakdown = await Promise.all(
    locations.map(async (loc) => {
      const locStaff = allStaff.filter((s) => s.locationId === loc.id);
      const locStaffIds = locStaff.map((s) => s.id);
      const locCerts = certs.filter((c) => locStaffIds.includes(c.staffId));

      const locStaffCertMap = new Map<number, string[]>();
      for (const cert of locCerts) {
        const status = computeStatus(cert.expirationDate);
        if (!locStaffCertMap.has(cert.staffId)) locStaffCertMap.set(cert.staffId, []);
        locStaffCertMap.get(cert.staffId)!.push(status);
      }

      let locCompliant = 0;
      let locExpiring = 0;
      let locExpired = 0;

      for (const staff of locStaff) {
        const statuses = locStaffCertMap.get(staff.id) ?? [];
        if (statuses.some((s) => s === "expired")) {
          locExpired++;
        } else if (statuses.some((s) => s === "expiring")) {
          locExpiring++;
        } else {
          locCompliant++;
        }
      }

      return {
        locationId: loc.id,
        locationName: loc.name,
        totalStaff: locStaff.length,
        compliantStaff: locCompliant,
        expiringSoonCount: locExpiring,
        expiredCount: locExpired,
      };
    })
  );

  // Count all staff across all locations (for free tier usage)
  const allUserStaff = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(inArray(staffTable.locationId, allLocationIds));

  const plan = await getUserPlan(userId);

  res.json({
    totalStaff: allStaff.length,
    compliantStaff,
    expiringSoonStaff,
    expiredCertifications,
    totalCertifications: certs.length,
    locationBreakdown,
    plan,
    freeTierUsage: {
      staffCount: allUserStaff.length,
      staffLimit: FREE_TIER_STAFF_LIMIT,
      locationCount: allLocationIds.length,
      locationLimit: FREE_TIER_LOCATION_LIMIT,
    },
  });
});

// Rising Star score calculator
router.get("/rising-star", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const queryParams = GetRisingStarScoreQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const locationId = queryParams.data.locationId;
  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, locationId), eq(locationsTable.clerkUserId, userId)));

  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  const staff = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.locationId, locationId), eq(staffTable.status, "active")));

  const staffIds = staff.map((s) => s.id);
  const certs = staffIds.length > 0
    ? await db
        .select({
          cert: certificationsTable,
          typeName: certificationTypesTable.name,
        })
        .from(certificationsTable)
        .innerJoin(certificationTypesTable, eq(certificationsTable.certificationTypeId, certificationTypesTable.id))
        .where(inArray(certificationsTable.staffId, staffIds))
    : [];

  const validCerts = certs.filter((c) => {
    const status = computeStatus(c.cert.expirationDate);
    return status === "valid" || status === "no_expiry";
  });

  const certTypeNames = validCerts.map((c) => c.typeName.toLowerCase());

  const totalStaff = staff.length;
  const staffWithCpr = staff.filter((s) =>
    validCerts.some((c) => c.cert.staffId === s.id && c.typeName.toLowerCase().includes("cpr"))
  ).length;
  const staffWithFirstAid = staff.filter((s) =>
    validCerts.some((c) => c.cert.staffId === s.id && c.typeName.toLowerCase().includes("first aid"))
  ).length;
  const staffWithCda = staff.filter((s) =>
    validCerts.some((c) => c.cert.staffId === s.id && (c.typeName.toLowerCase().includes("cda") || c.typeName.toLowerCase().includes("child development")))
  ).length;

  const cprPct = totalStaff > 0 ? staffWithCpr / totalStaff : 0;
  const firstAidPct = totalStaff > 0 ? staffWithFirstAid / totalStaff : 0;
  const cdaPct = totalStaff > 0 ? staffWithCda / totalStaff : 0;

  const hasCprAll = cprPct >= 1.0;
  const hasCprMost = cprPct >= 0.5;
  const hasFirstAidAll = firstAidPct >= 1.0;
  const hasFirstAidMost = firstAidPct >= 0.5;
  const hasCdaAny = cdaPct > 0;
  const hasCdaMost = cdaPct >= 0.5;

  // Categories
  const categories = [
    {
      name: "CPR Certification",
      score: hasCprAll ? 30 : hasCprMost ? 15 : 0,
      maxScore: 30,
      requirements: [
        {
          description: "50% of staff have valid CPR certification",
          met: hasCprMost,
          detail: `${staffWithCpr} of ${totalStaff} staff certified`,
        },
        {
          description: "100% of staff have valid CPR certification",
          met: hasCprAll,
          detail: hasCprAll ? "All staff certified" : `Need ${totalStaff - staffWithCpr} more staff`,
        },
      ],
    },
    {
      name: "First Aid Certification",
      score: hasFirstAidAll ? 30 : hasFirstAidMost ? 15 : 0,
      maxScore: 30,
      requirements: [
        {
          description: "50% of staff have valid First Aid certification",
          met: hasFirstAidMost,
          detail: `${staffWithFirstAid} of ${totalStaff} staff certified`,
        },
        {
          description: "100% of staff have valid First Aid certification",
          met: hasFirstAidAll,
          detail: hasFirstAidAll ? "All staff certified" : `Need ${totalStaff - staffWithFirstAid} more staff`,
        },
      ],
    },
    {
      name: "CDA / Child Development",
      score: hasCdaMost ? 40 : hasCdaAny ? 20 : 0,
      maxScore: 40,
      requirements: [
        {
          description: "At least 1 staff member has a CDA or Child Development credential",
          met: hasCdaAny,
          detail: hasCdaAny ? `${staffWithCda} staff with CDA credential` : "No CDA credentials found",
        },
        {
          description: "50% or more of staff have CDA or Child Development credentials",
          met: hasCdaMost,
          detail: hasCdaMost ? "Strong CDA credential coverage" : `${staffWithCda} of ${totalStaff} have credentials`,
        },
      ],
    },
  ];

  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const maxPossible = categories.reduce((sum, c) => sum + c.maxScore, 0);
  const overallScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  // Determine star level
  let currentLevel = 1;
  if (overallScore >= 80) currentLevel = 4;
  else if (overallScore >= 60) currentLevel = 3;
  else if (overallScore >= 40) currentLevel = 2;

  const nextLevel = currentLevel < 4 ? currentLevel + 1 : null;

  // Recommendations
  const recommendations: string[] = [];
  if (!hasCprAll) {
    recommendations.push(
      hasCprMost
        ? `Get remaining ${totalStaff - staffWithCpr} staff CPR-certified for full 2-star CPR credit`
        : "Enroll staff in CPR certification — required for Rising Star progress"
    );
  }
  if (!hasFirstAidAll) {
    recommendations.push(
      hasFirstAidMost
        ? `Get remaining ${totalStaff - staffWithFirstAid} staff First Aid-certified for full credit`
        : "Enroll staff in First Aid certification — required for Rising Star progress"
    );
  }
  if (!hasCdaMost) {
    recommendations.push(
      hasCdaAny
        ? "Encourage more staff to pursue CDA credentials to reach 50% threshold"
        : "Add CDA (Child Development Associate) credentials — key for 3-star and 4-star ratings"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current certification levels to keep your Rising Star status");
  }

  res.json({
    locationId: location.id,
    locationName: location.name,
    currentLevel,
    nextLevel,
    overallScore: Math.round(overallScore * 10) / 10,
    categories,
    recommendations,
  });
});

// CSV export
router.get("/export/csv", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const queryParams = ExportCsvQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const allLocationIds = await getUserLocationIds(userId);
  if (allLocationIds.length === 0) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=certifications.csv");
    res.send("Staff Name,Location,Role,Certification Type,Issued Date,Expiration Date,Status\n");
    return;
  }

  const { locationId } = queryParams.data;
  const targetIds = locationId ? [locationId] : allLocationIds;

  const rows = await db
    .select({
      staffFirstName: staffTable.firstName,
      staffLastName: staffTable.lastName,
      locationName: locationsTable.name,
      role: staffTable.role,
      certTypeName: certificationTypesTable.name,
      issuedDate: certificationsTable.issuedDate,
      expirationDate: certificationsTable.expirationDate,
    })
    .from(certificationsTable)
    .innerJoin(staffTable, eq(certificationsTable.staffId, staffTable.id))
    .innerJoin(locationsTable, eq(staffTable.locationId, locationsTable.id))
    .innerJoin(certificationTypesTable, eq(certificationsTable.certificationTypeId, certificationTypesTable.id))
    .where(inArray(staffTable.locationId, targetIds))
    .orderBy(staffTable.lastName, certificationsTable.expirationDate);

  const header = "Staff Name,Location,Role,Certification Type,Issued Date,Expiration Date,Status";
  const lines = rows.map((r) => {
    const status = computeStatus(r.expirationDate);
    const statusLabel = status === "valid" ? "Valid" : status === "expiring" ? "Expiring Soon" : status === "expired" ? "Expired" : "No Expiry";
    return [
      `"${r.staffFirstName} ${r.staffLastName}"`,
      `"${r.locationName}"`,
      `"${r.role}"`,
      `"${r.certTypeName}"`,
      r.issuedDate ?? "",
      r.expirationDate ?? "",
      statusLabel,
    ].join(",");
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=certifications.csv");
  res.send([header, ...lines].join("\n"));
});

export default router;
