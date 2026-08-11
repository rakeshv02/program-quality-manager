import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Initialize Stripe schema and data sync. Non-fatal on failure so the app
 * still serves (payments endpoints degrade gracefully).
 */
async function initStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set; skipping Stripe initialization");
    return;
  }

  try {
    // Ensure the application-owned users table exists (idempotent; makes a
    // clean database work without a manual drizzle push).
    const { db } = await import("@workspace/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl });

    // Provision the Pro product/price in Stripe if the account doesn't have
    // it yet (idempotent by lookup_key), so a fresh Stripe account works.
    const { ensureProPrice } = await import("./lib/ensureProPrice");
    await ensureProPrice();

    const { getStripeSync } = await import("./stripeClient");
    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");

    // Full backfill (products, prices, customers, subscriptions) — awaited so
    // checkout isn't opened until webhook + local data are in place. Note:
    // syncBackfill() without { object: "all" } backfills nothing.
    await stripeSync.syncBackfill({ object: "all" });
    logger.info("Stripe data synced");

    const { markStripeReady } = await import("./lib/stripeReady");
    markStripeReady();
  } catch (err) {
    logger.error({ err }, "Failed to initialize Stripe (continuing without it)");
  }
}

void initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
