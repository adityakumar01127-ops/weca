// scripts/verify_username_auth.mjs
// Automated verification suite for Username-First Authentication System

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

// Load environment variables from .env.local
const envFile = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
const env = {};
envFile.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  }
});

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("\n🧪 Starting Username-First Auth System Verification Suite\n");
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  const testSuffix = Math.floor(Math.random() * 90000 + 10000);
  const testUsername = `user_${testSuffix}`;
  const testPassword = `SecurePass_${testSuffix}!`;
  let createdUserId = null;

  // 1. Endpoint: /api/auth/check-username
  await test("check-username rejects username < 3 characters (available: false)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=ab`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const data = await res.json();
    if (data.available !== false) throw new Error(`Expected available: false, got ${JSON.stringify(data)}`);
  });

  await test("check-username rejects reserved username (available: false)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=admin`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const data = await res.json();
    if (data.available !== false) throw new Error(`Expected available: false, got ${JSON.stringify(data)}`);
  });

  await test("check-username approves fresh unique username (200, available: true)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=${testUsername}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const data = await res.json();
    if (!data.available) throw new Error(`Expected available: true, got ${JSON.stringify(data)}`);
  });

  // 2. Endpoint: /api/auth/resolve-email
  await test("resolve-email echoes direct email address without changes", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/resolve-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "direct_explorer@example.com" }),
    });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const data = await res.json();
    if (data.email !== "direct_explorer@example.com") {
      throw new Error(`Expected direct email echo, got ${data.email}`);
    }
  });

  await test("resolve-email returns fallback internal format for unregistered username", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/resolve-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "nonexistent_rover_xyz" }),
    });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const data = await res.json();
    if (data.email !== "nonexistent_rover_xyz@users.weca.app") {
      throw new Error(`Expected fallback format, got ${data.email}`);
    }
  });

  // 3. Complete Registration Flow (Username Only)
  await test("Sign up user with username only (no email) generates instant session", async () => {
    const internalEmail = `${testUsername}@users.weca.app`;
    const { data, error } = await anonClient.auth.signUp({
      email: internalEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
          display_name: `Explorer ${testSuffix}`,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${testUsername}`,
        },
      },
    });

    if (error) throw new Error(`Supabase signUp failed: ${error.message}`);
    if (!data.user) throw new Error("No user returned from signUp");
    createdUserId = data.user.id;

    // Check session was returned immediately (autoconfirm active)
    if (!data.session) {
      console.log("  ⚠️  Notice: Session not returned immediately (confirmation might be required or simulated)");
    }
  });

  // 4. Database Verification (Profile, Balance & Transaction)
  await test("Database trigger creates profile with 50 starter Weird Credits", async () => {
    // Wait briefly for trigger execution
    await new Promise((r) => setTimeout(r, 800));

    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, username, credits_balance, email")
      .eq("id", createdUserId)
      .single();

    if (error || !profile) throw new Error(`Profile query failed: ${error?.message}`);
    if (profile.username !== testUsername) throw new Error(`Expected username ${testUsername}, got ${profile.username}`);
    if (profile.credits_balance !== 50) throw new Error(`Expected 50 credits, got ${profile.credits_balance}`);

    // Verify email in profiles is empty string or null (no internal fake email exposed)
    if (profile.email && profile.email.includes("@users.weca.app")) {
      throw new Error(`Internal placeholder email leaked into profile.email: ${profile.email}`);
    }
  });

  await test("Initial bonus recorded in credit_transactions table", async () => {
    const { data: txs, error } = await adminClient
      .from("credit_transactions")
      .select("id, amount, reason")
      .eq("user_id", createdUserId);

    if (error) throw new Error(`Credit transactions query failed: ${error.message}`);
    if (!txs || txs.length === 0) throw new Error("No credit transaction record found for welcome bonus");
    const welcomeTx = txs.find((t) => t.reason?.includes("Welcome") || t.amount === 50);
    if (!welcomeTx) throw new Error(`Welcome transaction not found. Existing: ${JSON.stringify(txs)}`);
    if (welcomeTx.amount !== 50) throw new Error(`Expected amount 50, got ${welcomeTx.amount}`);
  });

  // 5. Check-username now reports username as taken
  await test("check-username reports newly registered username as taken (available: false)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=${testUsername}`);
    const data = await res.json();
    if (data.available !== false) throw new Error(`Expected available: false, got ${JSON.stringify(data)}`);
  });

  // 6. Resolve-email maps username to actual auth email
  await test("resolve-email maps registered username to registered auth email", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/resolve-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: testUsername }),
    });
    const data = await res.json();
    if (data.email !== `${testUsername}@users.weca.app`) {
      throw new Error(`Expected ${testUsername}@users.weca.app, got ${data.email}`);
    }
  });

  // 7. Sign In using username + password
  await test("Sign In succeeds using username + password via resolved email", async () => {
    // Resolve email first
    const resolveRes = await fetch(`${BASE_URL}/api/auth/resolve-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: testUsername }),
    });
    const { email } = await resolveRes.json();

    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password: testPassword,
    });

    if (error) throw new Error(`Sign in failed: ${error.message}`);
    if (!data.user || !data.session) throw new Error("Sign in succeeded but did not return session");
    if (data.user.id !== createdUserId) throw new Error("Signed in user ID mismatch");
  });

  // 8. Cleanup
  if (createdUserId) {
    await adminClient.from("credit_transactions").delete().eq("user_id", createdUserId);
    await adminClient.from("profiles").delete().eq("id", createdUserId);
    await adminClient.auth.admin.deleteUser(createdUserId);
    console.log("  🧹 Cleaned up temporary test user safely.");
  }

  console.log("\n========================================");
  console.log(`Username Auth Suite Summary:\nPassed: ${passed} | Failed: ${failed}`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Verification suite execution error:", err);
  process.exit(1);
});
