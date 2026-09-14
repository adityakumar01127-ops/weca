import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING_CATALOG } from "@/app/api/razorpay/order/route";
import { recordCreditTransaction } from "@/lib/credits";
import { logger } from "@/lib/logger";

/**
 * Standard Razorpay Checkout Webhook Handler.
 * Fulfills orders asynchronously for:
 * - payment.captured
 * - order.paid
 * 
 * Ensures orders are fulfilled even if user closes browser during payment.
 * Concurrency-safe deduplication via processed_webhook_events table.
 */
export async function POST(req: NextRequest) {
  const start = Date.now();
  let resolvedEventId: string | null = null;
  let supabase: any = null;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const eventIdHeader = req.headers.get("x-razorpay-event-id");
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // 1. Cryptographic HMAC-SHA256 Signature Verification
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: "Missing x-razorpay-signature header." },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "utf-8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        logger.error("Razorpay webhook signature verification failed");
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature." },
          { status: 401 }
        );
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        logger.error("RAZORPAY_WEBHOOK_SECRET missing in production environment");
        return NextResponse.json(
          { success: false, error: "Webhook secret required in production." },
          { status: 500 }
        );
      }
      logger.warn("Razorpay webhook received without secret configured (development mode)");
    }

    // 2. Parse payload
    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    resolvedEventId = eventIdHeader || eventData.id || eventData.event_id || null;
    const eventType = eventData.event;
    const payload = eventData.payload;

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Missing event payload." },
        { status: 400 }
      );
    }

    supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database client unavailable." },
        { status: 500 }
      );
    }

    // 3. Concurrency-Safe Deduplication Lock via processed_webhook_events
    if (resolvedEventId) {
      const { error: insertEventErr } = await supabase
        .from("processed_webhook_events")
        .insert({
          event_id: resolvedEventId,
          event_type: eventType,
          payload: eventData,
        });

      if (insertEventErr) {
        // Postgres unique constraint violation code '23505'
        if (
          insertEventErr.code === "23505" ||
          insertEventErr.message?.includes("duplicate key") ||
          insertEventErr.message?.includes("unique constraint")
        ) {
          logger.info("Duplicate Razorpay webhook event ignored", {
            eventId: resolvedEventId,
            eventType,
          });
          return NextResponse.json({
            success: true,
            message: "Event already processed (duplicate acknowledged).",
            duplicate: true,
          });
        }

        logger.error("Failed to acquire webhook deduplication lock:", insertEventErr);
        return NextResponse.json(
          { success: false, error: "Failed to record webhook event ID." },
          { status: 500 }
        );
      }
    }

    // 4. Handle Fulfillment Events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payment?.entity;
      const orderEntity = payload.order?.entity;

      // Extract notes metadata attached during order creation
      const notes = orderEntity?.notes || paymentEntity?.notes || {};
      const userId = notes.userId;
      const planKey = notes.planKey;
      const paymentId = paymentEntity?.id || "webhook_captured";

      if (userId && planKey) {
        const plan = PRICING_CATALOG[planKey];
        if (plan) {
          if (plan.type === "credits" && plan.credits) {
            // Accrue credits into user wallet
            await recordCreditTransaction(supabase, {
              userId,
              amount: plan.credits,
              reason: `Webhook: Purchased ${plan.name} (Payment: ${paymentId})`,
            });
            logger.info("Credits fulfilled via webhook", { userId, planKey, credits: plan.credits });
          } else if (plan.type === "subscription") {
            // Upgrade user profile to Hunter Pro
            await supabase
              .from("profiles")
              .update({
                tier: "Hunter Pro",
                is_pro: true,
              })
              .eq("id", userId);
            logger.info("Subscription fulfilled via webhook", { userId, planKey });
          }
        }
      }
    }

    logger.info("Razorpay standard webhook processed successfully", {
      eventType,
      eventId: resolvedEventId,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      received: true,
      event: eventType,
    });
  } catch (err: any) {
    logger.error("Razorpay standard webhook processing error:", err);
    // Release event lock if an unexpected exception crashed execution
    if (resolvedEventId && supabase) {
      await supabase
        .from("processed_webhook_events")
        .delete()
        .eq("event_id", resolvedEventId)
        .catch(() => {});
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
