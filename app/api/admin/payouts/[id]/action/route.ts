import { NextRequest, NextResponse } from "next/server";
import { processAdminPayoutAction } from "@/lib/supabase/data";
import { requireAdminUser } from "@/lib/auth-server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminUser(req);

    const { id: requestId } = await context.params;
    const body = await req.json();
    const { action, notes } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { success: false, error: "Action must be either 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const result = await processAdminPayoutAction({
      requestId,
      action,
      adminUserId: auth.adminUserId || "admin",
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payoutRequest: result.payoutRequest,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status }
    );
  }
}

