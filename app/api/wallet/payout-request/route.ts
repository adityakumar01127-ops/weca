import { NextRequest, NextResponse } from "next/server";
import { createPayoutRequest, getUserPayoutRequests, getUserCreditTransactions } from "@/lib/supabase/data";
import { getAuthenticatedUser, isUserAdmin } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId") || user.id;

    // Security Guard: Non-admins are strictly forbidden from viewing another user's bank details or payouts
    if (requestedUserId !== user.id) {
      const isAdmin = await isUserAdmin(user.id, user.email);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You can only view your own financial details." },
          { status: 403 }
        );
      }
    }

    const [payouts, transactions] = await Promise.all([
      getUserPayoutRequests(requestedUserId),
      getUserCreditTransactions(requestedUserId),
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
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to request a payout." },
        { status: 401 }
      );
    }

    // Always use the verified session user's ID
    const userId = user.id;

    const body = await req.json();
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

