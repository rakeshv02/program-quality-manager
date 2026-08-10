import { Router } from "express";
import Stripe from "stripe";
import { requireAuth } from "@/lib/requireAuth";

const router = Router();

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

// Create checkout session for Pro plan upgrade
router.post("/api/payments/checkout", requireAuth, async (req, res) => {
  try {
    const { userId, userEmail } = req.auth;

    if (!userId || !userEmail) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Program Quality Manager - Pro Tier",
              description:
                "Unlimited staff, locations, SMS alerts, PDF reports, email support",
            },
            unit_amount: 4900, // $49.00 in cents
            recurring: {
              interval: "month",
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: `${process.env.FRONTEND_URL || "https://compliance.texaschildcareadvisors.com"}/dashboard?upgrade=success`,
      cancel_url: `${process.env.FRONTEND_URL || "https://compliance.texaschildcareadvisors.com"}/settings`,
      subscription_data: {
        metadata: {
          user_id: userId,
          plan: "pro",
        },
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
    });
  }
});

// Webhook handler for Stripe events
router.post("/api/payments/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created":
        // Update user subscription status in database
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId && subscription.status === "active") {
          // Update user tier to Pro in database
          // This would require adding a users table and subscription tracking
          console.log(`User ${userId} subscription activated`);
        }
        break;

      case "customer.subscription.deleted":
        // Downgrade user to Free tier
        const canceledSub = event.data.object as Stripe.Subscription;
        const canceledUserId = canceledSub.metadata?.user_id;

        if (canceledUserId) {
          console.log(`User ${canceledUserId} subscription canceled`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook error" });
  }
});

export default router;
