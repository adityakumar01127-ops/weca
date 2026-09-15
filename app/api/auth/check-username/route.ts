import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks if a requested username is available or already taken.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username") || "";
    const cleanUsername = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json({
        available: false,
        message: "Username must be at least 3 characters long.",
      });
    }

    if (cleanUsername.length > 20) {
      return NextResponse.json({
        available: false,
        message: "Username must be 20 characters or fewer.",
      });
    }

    // Disallowed reserved words
    const reserved = ["admin", "root", "system", "weca", "support", "help", "moderator", "official"];
    if (reserved.includes(cleanUsername)) {
      return NextResponse.json({
        available: false,
        message: "This username is reserved.",
      });
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ available: true });
    }

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        available: false,
        message: "This username is already taken.",
      });
    }

    return NextResponse.json({
      available: true,
      message: "Username is available!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error checking username";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
