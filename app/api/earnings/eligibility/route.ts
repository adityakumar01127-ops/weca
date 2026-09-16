import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { enrollInCreatorProgram, checkCreatorEligibility } from "@/lib/earnings/creator-eligibility";

async function getSupabaseWithUser(req?: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
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

  let user = null;
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  return { supabase, user };
}

/**
 * GET /api/earnings/eligibility — Get creator eligibility status & progress
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const progress = await checkCreatorEligibility(supabase, user.id);
    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/earnings/eligibility — Enroll in the Creator Eligibility Program
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const result = await enrollInCreatorProgram(supabase, user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Immediately check progress after enrollment
    const progress = await checkCreatorEligibility(supabase, user.id);

    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
