import { NextRequest, NextResponse } from "next/server";
import { getAdminPayoutRequests } from "@/lib/supabase/data";
import { requireAdminUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser(req);

    const payouts = await getAdminPayoutRequests();
    return NextResponse.json({
      success: true,
      payouts,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status }
    );
  }
}

