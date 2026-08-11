import { logger } from "./logger";

export const PRO_PRICE_LOOKUP_KEY = "pqm_pro_monthly";

/**
 * Ensures the Pro product and $49/mo price exist in the connected Stripe
 * account. Idempotent — checks by price lookup_key first, so a fresh Stripe
 * account is provisioned automatically at startup and existing accounts are
 * left untouched.
 */
export async function ensureProPrice(): Promise<void> {
  const { getUncachableStripeClient } = await import("../stripeClient");
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.prices.list({
    lookup_keys: [PRO_PRICE_LOOKUP_KEY],
    limit: 1,
  });
  if (existing.data.length > 0) return;

  const product = await stripe.products.create({
    name: "Program Quality Manager Pro",
    description:
      "Unlimited staff and locations, full certification tracking for Texas childcare programs.",
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 4900, // $49.00
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: PRO_PRICE_LOOKUP_KEY,
  });

  logger.info({ productId: product.id, priceId: price.id }, "Provisioned Pro product/price in Stripe");
}
