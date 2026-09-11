import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/services/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "usr-demo";

    const profileData = await getUserProfile(username);
    return NextResponse.json(profileData);
  } catch (error: unknown) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
  }
}
