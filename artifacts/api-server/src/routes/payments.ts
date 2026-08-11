import { Router } from "express";

const router = Router();

// Stripe payments endpoint - stub for now
router.post("/payments/checkout", async (req, res) => {
  res.status(501).json({ error: "Stripe integration not yet configured" });
});

export default router;