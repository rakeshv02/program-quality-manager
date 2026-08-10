import { Router } from "express";
import { db } from "@workspace/db";
import locationsRouter from "./locations";
import staffRouter from "./staff";
import certificationTypesRouter from "./certificationTypes";
import certificationsRouter from "./certifications";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";

const router = Router();

router.get("/healthz", async (_req, res) => {
  res.json({ status: "ok" });
});

router.use(locationsRouter);
router.use(staffRouter);
router.use(certificationTypesRouter);
router.use(certificationsRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);

export default router;
