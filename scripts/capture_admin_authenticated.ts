if (typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qaaeshezrdxfsaxlpmzo.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYWVzaGV6cmR4ZnNheGxwbXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTEyNjExOSwiZXhwIjoyMTA0NzAyMTE5fQ.PCzOthxbuKq7EkLNbPw9xa9xz1MyTkHplVI-1LoRrCc";
const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/a2556c88-68c1-49c1-a381-72f0bd98bb58";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  console.log("1. Setting up admin test user...");
  const adminId = "66336baf-283f-4db2-8840-57e409ba2083";
  const adminEmail = "admin@weca.app";
  const adminPassword = "AdminPassword123!";

  await supabase.auth.admin.updateUserById(adminId, {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  await supabase.from("profiles").update({
    username: "lead_curator",
    display_name: "Lead Curator & Admin",
    is_admin: true,
    credits_balance: 1850,
  }).eq("id", adminId);

  console.log("2. Inserting sample payout requests for visualization...");
  // Sample 1: Clean request
  await supabase.from("payout_requests").insert({
    user_id: adminId,
    amount: 500,
    currency: "INR",
    status: "pending",
    payout_details: {
      method: "upi",
      name: "Lead Curator",
      upi_id: "curator@okhdfcbank",
    },
    risk_score: 0,
    flagged_suspicious: false,
    suspicion_reasons: [],
  });

  // Sample 2: Suspicious flagged request
  await supabase.from("payout_requests").insert({
    user_id: adminId,
    amount: 1000,
    currency: "INR",
    status: "pending",
    payout_details: {
      method: "bank_account",
      name: "Unknown Sybil Entity",
      account_number: "9876543210001",
      ifsc: "SBIN0001234",
    },
    risk_score: 75,
    flagged_suspicious: true,
    suspicion_reasons: [
      "Account age is 0.2 days (minimum recommended: 7 days)",
      "User has uploaded 0 posts (minimum required: 1)",
      "Suspicious voting cluster: synchronized votes detected with affiliated accounts",
    ],
  });

  console.log("3. Launching browser session...");
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Log in as the admin user
  console.log("4. Logging in via /login UI...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await page.type("input[type='email']", adminEmail);
  await page.type("input[type='password']", adminPassword);
  await page.click("button[type='submit']");
  await new Promise((r) => setTimeout(r, 2000));

  // Navigate to /wallet and open modal
  console.log("5. Capturing Wallet with Request Payout Modal open...");
  await page.goto(`${BASE_URL}/wallet`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const target = btns.find((b) => b.textContent?.includes("Request Payout"));
    if (target) (target as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotModal = "shot_phase4_03_wallet_payout_modal.png";
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotModal) });
  console.log(`Saved modal screenshot: ${shotModal}`);

  // Navigate to /admin/payouts with authenticated admin session
  console.log("6. Capturing Admin Desk with live queue...");
  await page.goto(`${BASE_URL}/admin/payouts`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  const shotAdminLive = "shot_phase4_04_admin_desk_live_queue.png";
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotAdminLive) });
  console.log(`Saved live admin queue screenshot: ${shotAdminLive}`);

  await browser.close();
  console.log("Done capturing visual demonstrations!");
}

run().catch(console.error);
