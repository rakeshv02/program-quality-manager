import { sql, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export const FREE_TIER_STAFF_LIMIT = 12;
export const FREE_TIER_LOCATION_LIMIT = 2;

/** Lookup key of the Pro monthly price (created by scripts/src/seed-products.ts). */
export const PRO_PRICE_LOOKUP_KEY = "pqm_pro_monthly";

/**
 * Returns "pro" when the user has an active (or trialing) Stripe subscription
 * that contains the Pro price, otherwise "free". Subscription state is read
 * from the `stripe` schema, which stripe-replit-sync keeps in sync via
 * webhooks — no custom webhook logic needed.
 */
export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.stripeCustomerId) return "free";

  try {
    const result = await db.execute(
      sql`SELECT s.id
          FROM stripe.subscriptions s
          JOIN stripe.subscription_items si ON si.subscription = s.id
          JOIN stripe.prices p ON p.id = si.price
          WHERE s.customer = ${user.stripeCustomerId}
            AND s.status IN ('active', 'trialing')
            AND p.lookup_key = ${PRO_PRICE_LOOKUP_KEY}
          LIMIT 1`
    );
    return result.rows.length > 0 ? "pro" : "free";
  } catch {
    // stripe schema may not exist yet (before first init) — treat as free
    return "free";
  }
}
