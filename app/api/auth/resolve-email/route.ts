import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolves a login identifier (username or email) into the registered auth email.
 * Allows users to log in directly with their username even if they signed up without an email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = (body.identifier || body.username || "").trim();

    if (!rawIdentifier) {
      return NextResponse.json(
        { error: "Username or email is required" },
        { status: 400 }
      );
    }

    // If it's already an email, return it directly
    if (rawIdentifier.includes("@")) {
      return NextResponse.json({
        email: rawIdentifier.toLowerCase(),
        isUsername: false,
      });
    }

    const cleanUsername = rawIdentifier.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Invalid username characters" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      // Fallback deterministic email mapping
      return NextResponse.json({
        email: `${cleanUsername}@users.weca.app`,
        isUsername: true,
      });
    }

    // Lookup profile by username
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, username, email")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (profile) {
      // If profile already has the email cached
      if (profile.email) {
        return NextResponse.json({
          email: profile.email.toLowerCase(),
          isUsername: true,
        });
      }

      // Query auth.users to get the registered email
      try {
        const { data: authUser, error: authErr } = await adminClient.auth.admin.getUserById(profile.id);
        if (!authErr && authUser?.user?.email) {
          return NextResponse.json({
            email: authUser.user.email.toLowerCase(),
            isUsername: true,
          });
        }
      } catch (err) {
        console.warn("Could not query auth.admin.getUserById:", err);
      }
    }

    // Default fallback to deterministic internal email
    return NextResponse.json({
      email: `${cleanUsername}@users.weca.app`,
      isUsername: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve identifier";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
