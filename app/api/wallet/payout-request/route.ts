import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createPayoutRequest, getUserPayoutRequests, getUserCreditTransactions } from "@/lib/supabase/data";

async function getAuthenticatedUser() {
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

  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId") || user?.id;

    if (!queryUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [payouts, transactions] = await Promise.all([
      getUserPayoutRequests(queryUserId),
      getUserCreditTransactions(queryUserId),
    ]);

    return NextResponse.json({
      success: true,
      payouts,
      transactions,
    });
  } catch (err: any) {
    console.error("GET /api/wallet/payout-request error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const body = await req.json();

    const userId = user?.id || body.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to request a payout." },
        { status: 401 }
      );
    }

    const { amount, details } = body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid payout amount is required." },
        { status: 400 }
      );
    }

    if (!details || !details.method || !details.name) {
      return NextResponse.json(
        { success: false, error: "Incomplete payout details provided." },
        { status: 400 }
      );
    }

    if (details.method === "upi" && !details.upi_id) {
      return NextResponse.json(
        { success: false, error: "UPI ID (VPA) is required for UPI payouts." },
        { status: 400 }
      );
    }

    if (details.method === "bank_account" && (!details.account_number || !details.ifsc)) {
      return NextResponse.json(
        { success: false, error: "Account Number and IFSC Code are required for bank payouts." },
        { status: 400 }
      );
    }

    const result = await createPayoutRequest({
      userId,
      amount,
      details,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payoutRequest: result.payoutRequest,
    });
  } catch (err: any) {
    console.error("POST /api/wallet/payout-request error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
