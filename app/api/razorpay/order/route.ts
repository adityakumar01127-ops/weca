import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

// Standard pricing catalog in Indian Rupees (INR)
export const PRICING_CATALOG: Record<
  string,
  { name: string; amountPaise: number; credits?: number; type: "subscription" | "credits" }
> = {
  hunter_pro_monthly: {
    name: "WICA Hunter Pro (Monthly)",
    amountPaise: 49900, // ₹499
    type: "subscription",
  },
  hunter_pro_annual: {
    name: "WICA Hunter Pro (Annual)",
    amountPaise: 399900, // ₹3,999 (save 20%)
    type: "subscription",
  },
  credits_pack_small: {
    name: "500 Weird Credits Pack",
    amountPaise: 9900, // ₹99
    credits: 500,
    type: "credits",
  },
  credits_pack_medium: {
    name: "1,500 Weird Credits Pack",
    amountPaise: 24900, // ₹249
    credits: 1500,
    type: "credits",
  },
  credits_pack_large: {
    name: "5,000 Weird Credits Pack",
    amountPaise: 69900, // ₹699
    credits: 5000,
    type: "credits",
  },
};

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
        { error: "Authentication required to initiate payment." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const planKey = body.plan as string;
    const plan = PRICING_CATALOG[planKey];

    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan: '${planKey}'. Choose a valid subscription or credit pack.` },
        { status: 400 }
      );
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`;

    // If Razorpay credentials are fully configured, call the live Razorpay Orders API
    if (keyId && keySecret) {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: plan.amountPaise,
          currency: "INR",
          receipt,
          notes: {
            userId: user.id,
            planKey,
            planName: plan.name,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error("Razorpay Orders API error", { error: errText, status: response.status });
        return NextResponse.json(
          { error: "Failed to create payment order with Razorpay." },
          { status: response.status }
        );
      }

      const orderData = await response.json();
      logger.info("Razorpay order created", {
        orderId: orderData.id,
        userId: user.id,
        planKey,
        durationMs: Date.now() - start,
      });

      return NextResponse.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
        planName: plan.name,
        userEmail: user.email,
      });
    }

    // Fallback order generation for testing mode when keys are not yet input
    const mockOrderId = `order_test_${Date.now()}`;
    logger.info("Test order created (API keys pending configuration)", {
      orderId: mockOrderId,
      userId: user.id,
      planKey,
    });

    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: plan.amountPaise,
      currency: "INR",
      keyId: keyId || "rzp_test_placeholder",
      planName: plan.name,
      userEmail: user.email,
      isTestMock: !keySecret,
    });
  } catch (err: unknown) {
    logger.error("Order creation internal error", {
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    });
    return NextResponse.json(
      { error: "Internal server error creating payment order." },
      { status: 500 }
    );
  }
}
