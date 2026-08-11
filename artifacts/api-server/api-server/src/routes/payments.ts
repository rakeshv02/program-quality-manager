import { Router } from "express";

const router = Router();

// Payments stub - configured via environment
router.post("/api/payments/checkout", async (req, res) => {
  res.status(501).json({ error: "Payments not configured" });
});

export default router;