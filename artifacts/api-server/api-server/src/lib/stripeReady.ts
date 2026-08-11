/**
 * Tracks whether Stripe initialization (migrations, webhook registration, and
 * the initial full backfill) has completed. Checkout is gated on this so a
 * customer can't pay before the webhook exists to record the subscription.
 */
let ready = false;

export function markStripeReady(): void {
  ready = true;
}

export function isStripeReady(): boolean {
  return ready;
}
