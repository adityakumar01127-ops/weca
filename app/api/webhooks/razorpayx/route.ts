import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { recordCreditTransaction } from "@/lib/credits";

export async function POST(req: NextRequest) {
  let resolvedEventId: string | null = null;
  let supabase: any = null;

  try {
    // 1. Read raw string payload directly from the stream BEFORE any JSON parsing.
    // Razorpay HMAC-SHA256 signature verification MUST be calculated on the exact raw body string.
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const eventIdHeader = req.headers.get("x-razorpay-event-id");
    const webhookSecret = process.env.RAZORPAYX_WEBHOOK_SECRET;

    // 2. Verify HMAC Signature (FAIL CLOSED in production if secret is missing)
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: "Missing x-razorpay-signature header" },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "utf-8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

      // Constant-time comparison to prevent timing attacks
      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        console.error("RazorpayX webhook signature verification failed");
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else {
      // Fail closed: In production, refuse to accept unsigned webhooks if secret is not set
      if (process.env.NODE_ENV === "production") {
        console.error("RazorpayX webhook secret missing in production environment: refusing request");
        return NextResponse.json(
          { success: false, error: "Server misconfiguration: webhook secret required in production" },
          { status: 500 }
        );
      }
      console.warn(
        "RazorpayX webhook received without RAZORPAYX_WEBHOOK_SECRET configured (development/test mode)"
      );
    }

    // 3. Parse JSON only AFTER signature check passes
    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    resolvedEventId = eventIdHeader || eventData.id || eventData.event_id || null;
    const eventType = eventData.event;
    const payoutEntity = eventData.payload?.payout?.entity;

    if (!payoutEntity) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: missing payout entity" },
        { status: 400 }
      );
    }

    supabase = createAdminClient() || createClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database client unavailable" },
        { status: 500 }
      );
    }

    // 4. Concurrency-Safe Deduplication Lock via Primary Key insertion FIRST
    // Insert event_id into processed_webhook_events before doing any work.
    // If two near-simultaneous deliveries arrive concurrently, the second will hit a PK collision
    // (code 23505) and terminate immediately, preventing duplicate refunds or status mutations.
    if (resolvedEventId) {
      const { error: insertEventErr } = await supabase
        .from("processed_webhook_events")
        .insert({
          event_id: resolvedEventId,
          event_type: eventType,
          payload: eventData,
        });

      if (insertEventErr) {
        // Postgres unique constraint violation code '23505' or duplicate key message
        if (
          insertEventErr.code === "23505" ||
          insertEventErr.message?.includes("duplicate key") ||
          insertEventErr.message?.includes("unique constraint")
        ) {
          console.warn(
            `[RazorpayX Webhook] Concurrent/duplicate event detected via PK collision: ${resolvedEventId}`
          );
          return NextResponse.json({
            success: true,
            message: "Event already processed (duplicate acknowledged).",
            eventId: resolvedEventId,
            duplicate: true,
          });
        }

        console.error("Failed to acquire event deduplication lock:", insertEventErr);
        return NextResponse.json(
          { success: false, error: "Failed to record webhook event ID" },
          { status: 500 }
        );
      }
    }

    // 5. Locate matching payout_requests row
    let query = supabase.from("payout_requests").select("*");
    if (
      payoutEntity.reference_id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payoutEntity.reference_id
      )
    ) {
      query = query.eq("id", payoutEntity.reference_id);
    } else {
      query = query.eq("razorpayx_payout_id", payoutEntity.id);
    }

    const { data: request, error: findError } = await query.single();
    if (findError || !request) {
      console.warn("Webhook received for unknown payout request:", {
        payoutId: payoutEntity.id,
        referenceId: payoutEntity.reference_id,
      });
      if (resolvedEventId && supabase) {
        await supabase
          .from("processed_webhook_events")
          .delete()
          .eq("event_id", resolvedEventId)
          .catch(() => {});
      }
      return NextResponse.json(
        { success: false, error: "Matching payout request not found" },
        { status: 404 }
      );
    }

    console.log(
      `[RazorpayX Webhook] Handling event: ${eventType} (Event ID: ${resolvedEventId}) for payout #${request.id}`
    );

    let responseJson: any;

    // 6. Handle Event Types
    switch (eventType) {
      case "payout.processed": {
        // Payout settled successfully: THIS sets status to "paid"
        const utr = payoutEntity.utr || "N/A";
        const noteAppend = `Settled via RazorpayX (UTR: ${utr})`;
        const updatedNotes = request.admin_notes
          ? `${request.admin_notes} | ${noteAppend}`
          : noteAppend;

        const { error: updateErr } = await supabase
          .from("payout_requests")
          .update({
            status: "paid",
            processed_at: new Date().toISOString(),
            admin_notes: updatedNotes,
            razorpayx_payout_id: payoutEntity.id,
          })
          .eq("id", request.id);

        if (updateErr) {
          throw new Error(`Failed to update status to paid on payout.processed: ${updateErr.message}`);
        }

        responseJson = {
          success: true,
          message: `Payout #${request.id} marked as paid.`,
          status: "paid",
        };
        break;
      }

      case "payout.failed": {
        // Payout failed: set status to rejected and REFUND user credits
        const reason = payoutEntity.failure_reason || "Bank or gateway failure";
        const noteAppend = `Payout failed via RazorpayX: ${reason}. Credits refunded.`;
        const updatedNotes = request.admin_notes
          ? `${request.admin_notes} | ${noteAppend}`
          : noteAppend;

        // 1. Refund credits back to creator
        const refundResult = await recordCreditTransaction(supabase, {
          userId: request.user_id,
          amount: request.amount,
          reason: `Refund: Payout #${request.id.slice(0, 8)} failed (${reason})`,
          payoutRequestId: request.id,
        });

        if (!refundResult.success) {
          console.error("Failed to refund credits on payout.failed:", refundResult.error);
        }

        // 2. Mark request as rejected
        const { error: updateErr } = await supabase
          .from("payout_requests")
          .update({
            status: "rejected",
            processed_at: new Date().toISOString(),
            admin_notes: updatedNotes,
            razorpayx_payout_id: payoutEntity.id,
          })
          .eq("id", request.id);

        if (updateErr) {
          throw new Error(`Failed to update status to rejected on payout.failed: ${updateErr.message}`);
        }

        responseJson = {
          success: true,
          message: `Payout #${request.id} marked as rejected and credits refunded.`,
          status: "rejected",
        };
        break;
      }

      case "payout.reversed": {
        // Beneficiary bank reversed payout: set status to rejected and REFUND user credits
        const noteAppend = `Payout reversed by beneficiary bank. Credits refunded.`;
        const updatedNotes = request.admin_notes
          ? `${request.admin_notes} | ${noteAppend}`
          : noteAppend;

        // 1. Refund credits back to creator
        const refundResult = await recordCreditTransaction(supabase, {
          userId: request.user_id,
          amount: request.amount,
          reason: `Refund: Payout #${request.id.slice(0, 8)} reversed by bank`,
          payoutRequestId: request.id,
        });

        if (!refundResult.success) {
          console.error("Failed to refund credits on payout.reversed:", refundResult.error);
        }

        // 2. Mark request as rejected
        const { error: updateErr } = await supabase
          .from("payout_requests")
          .update({
            status: "rejected",
            processed_at: new Date().toISOString(),
            admin_notes: updatedNotes,
            razorpayx_payout_id: payoutEntity.id,
          })
          .eq("id", request.id);

        if (updateErr) {
          throw new Error(`Failed to update status on payout.reversed: ${updateErr.message}`);
        }

        responseJson = {
          success: true,
          message: `Payout #${request.id} reversed and credits refunded.`,
          status: "rejected",
        };
        break;
      }

      default:
        console.log(`[RazorpayX Webhook] Informational or unhandled event: ${eventType}`);
        responseJson = {
          success: true,
          message: `Event ${eventType} received and acknowledged.`,
        };
    }

    return NextResponse.json(responseJson);
  } catch (err: any) {
    console.error("RazorpayX webhook processing error:", err);
    // If downstream processing threw an unexpected error, release the lock so RazorpayX retry can succeed
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
