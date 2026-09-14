import { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export interface AuthenticatedAdmin {
  user: User;
  isAdmin: true;
  adminUserId: string;
}

/**
 * Retrieves the currently authenticated Supabase user from server cookies.
 * Returns null if the user is unauthenticated or session is invalid.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error("getAuthenticatedUser error:", err);
    return null;
  }
}

/**
 * Enforces that a valid user session exists.
 * Throws an Error with status 401 if unauthenticated.
 */
export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    const err = new Error("Authentication required. Please sign in.");
    (err as any).statusCode = 401;
    throw err;
  }
  return user;
}

/**
 * Checks if a user is an administrator via profiles.is_admin or admin email whitelist.
 */
export async function isUserAdmin(userId: string, email?: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || "adityakumar01127@gmail.com";
  const verifiedAdminEmails = [
    adminEmail,
    "admin@weca.app",
    "adityakaushik1125@gmail.com",
    "adityakaushik4664@gmail.com",
  ];
  if (email && verifiedAdminEmails.includes(email)) {
    return true;
  }

  const adminClient = createAdminClient();
  if (!adminClient) return false;

  try {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_admin, role")
      .eq("id", userId)
      .maybeSingle();

    return Boolean(profile?.is_admin || (profile as any)?.role === "admin");
  } catch (err) {
    console.error("isUserAdmin query error:", err);
    return false;
  }
}

/**
 * Enforces admin authorization.
 * 1. Accepts valid Service Role Key in Authorization header (for secure background jobs).
 * 2. Checks active session user against profiles.is_admin and ADMIN_EMAIL.
 * Throws 401 if unauthenticated or 403 if forbidden.
 */
export async function requireAdminUser(req?: NextRequest): Promise<AuthenticatedAdmin> {
  // Check authorization header for server-to-server calls with the true Service Role Key
  if (req && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            email: "service-role@system",
          } as User,
          isAdmin: true,
          adminUserId: "00000000-0000-0000-0000-000000000000",
        };
      }
    }
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    const err = new Error("Authentication required.");
    (err as any).statusCode = 401;
    throw err;
  }

  const admin = await isUserAdmin(user.id, user.email);
  if (!admin) {
    const err = new Error("Forbidden: Administrator privileges required.");
    (err as any).statusCode = 403;
    throw err;
  }

  return {
    user,
    isAdmin: true,
    adminUserId: user.id,
  };
}
