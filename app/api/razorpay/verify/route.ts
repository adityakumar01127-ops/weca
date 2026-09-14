import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { PRICING_CATALOG } from "../order/route";
import { recordCreditTransaction } from "@/lib/credits";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to verify payment." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan: planKey } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { error: "Missing razorpay_order_id or razorpay_payment_id" },
        { status: 400 }
      );
    }

    const plan = PRICING_CATALOG[planKey];
    if (!plan) {
      return NextResponse.json({ error: "Unknown plan purchased" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Cryptographic signature verification (Fail closed in production)
    if (secret) {
      if (!razorpay_signature) {
        return NextResponse.json(
          { error: "Missing razorpay_signature header/payload" },
          { status: 400 }
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const sigBuffer = Buffer.from(razorpay_signature, "utf-8");
      const expectedBuffer = Buffer.from(generatedSignature, "utf-8");

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        logger.error("Razorpay signature mismatch", {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
        return NextResponse.json(
          { error: "Payment verification failed: invalid signature" },
          { status: 400 }
        );
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        logger.error("RAZORPAY_KEY_SECRET missing in production: refusing unverified payment fulfillment");
        return NextResponse.json(
          { error: "Payment gateway configuration error. Contact support." },
          { status: 500 }
        );
      }

      // Development mock fallback: only allow explicitly tagged test orders
      if (!razorpay_order_id.startsWith("order_test_")) {
        return NextResponse.json(
          { error: "Signature verification required." },
          { status: 400 }
        );
      }
      logger.warn("Dev mode mock payment verification accepted for order_test_*");
    }


    // Payment is verified! Now fulfill the order in Supabase
    const adminSupabase = createAdminClient();

    if (adminSupabase) {
      if (plan.type === "credits" && plan.credits) {
        // Accrue Weird Credits
        await recordCreditTransaction(adminSupabase, {
          userId: user.id,
          amount: plan.credits,
          reason: `Purchased ${plan.name} (Payment ID: ${razorpay_payment_id})`,
        });
      } else if (plan.type === "subscription") {
        // Upgrade user to Pro in profiles table
        await adminSupabase
          .from("profiles")
          .update({
            tier: "Hunter Pro",
            is_pro: true,
          } as any)
          .eq("id", user.id);
      }
    }

    logger.info("Payment verified and fulfilled successfully", {
      userId: user.id,
      paymentId: razorpay_payment_id,
      plan: plan.name,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      message: `${plan.name} activated successfully!`,
      planName: plan.name,
      paymentId: razorpay_payment_id,
    });
  } catch (err: unknown) {
    logger.error("Payment verification exception", {
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    });
    return NextResponse.json(
      { error: "Internal server error verifying payment" },
      { status: 500 }
    );
  }
}
