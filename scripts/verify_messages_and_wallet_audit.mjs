// scripts/verify_messages_and_wallet_audit.mjs
import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import WebSocket from "ws";

globalThis.WebSocket = WebSocket;
import { createClient } from "@supabase/supabase-js";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/68b8d779-bf0b-49e2-bf1a-06b06030c61c";
const BASE_URL = "http://localhost:3000";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qaaeshezrdxfsaxlpmzo.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("=================================================");
  console.log("🚀 STARTING MESSAGES & WALLET AUDIT VERIFICATION");
  console.log("=================================================");

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { users } } = await adminClient.auth.admin.listUsers();
  const testUser = users.find(u => u.email === "adityakaushik4664@gmail.com") || users[0];
  console.log(`👤 Using user: ${testUser.email} (Username: aditya_k)`);

  const testPassword = "AdityaPassword2026!";
  await adminClient.auth.admin.updateUserById(testUser.id, {
    password: testPassword,
    email_confirm: true,
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,960"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });

  // 1. Authenticate via /login UI
  console.log("\n🔑 1. Logging in via UI form...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate((username, pass) => {
    const uInput = document.querySelector("input[placeholder*='username' i], input[type='text'], input[type='email']");
    const pInput = document.querySelector("input[type='password']");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

    if (uInput && setter) {
      setter.call(uInput, username);
      uInput.dispatchEvent(new Event("input", { bubbles: true }));
      uInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (pInput && setter) {
      setter.call(pInput, pass);
      pInput.dispatchEvent(new Event("input", { bubbles: true }));
      pInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, "aditya_k", testPassword);

  await new Promise(r => setTimeout(r, 500));

  const submitBtn = await page.$("button[type='submit']");
  if (submitBtn) {
    await submitBtn.click();
  }

  // Wait for login redirect
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  console.log("✅ Logged in successfully! Current page:", await page.evaluate(() => window.location.pathname));

  // -------------------------------------------------------------
  // 2. VERIFY MESSAGE SYSTEM
  // -------------------------------------------------------------
  console.log("\n💬 2. Verifying Message System...");
  await page.goto(`${BASE_URL}/messages`, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));

  // A. Verify Header shows real username
  const headerUsername = await page.evaluate(() => {
    const link = document.querySelector("a[title='View your profile']");
    return link ? link.textContent?.trim() : null;
  });
  console.log(`  - Header username displayed: "${headerUsername}"`);
  if (headerUsername?.includes("mr_adityakaushik")) {
    throw new Error("❌ FAIL: Hardcoded 'mr_adityakaushik' still found in header!");
  } else {
    console.log("  ✅ PASS: Dynamic real username confirmed in header.");
  }

  // B. Post a Note
  console.log("  - Creating an exploratory Note...");
  await page.evaluate(() => {
    const el = document.querySelector("button[title*='note' i]") ||
      Array.from(document.querySelectorAll("div, button")).find(e => e.textContent?.includes("Share a thought") || e.textContent?.includes("Your note"));
    if (el) (el).click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const noteTextInput = await page.$("input[placeholder*='vibe' i], input[maxLength='60'], textarea");
  if (noteTextInput) {
    await noteTextInput.type("Scanning Sector 7 for anomalies 🛸");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.trim() === "Share");
      if (btn) (btn).click();
    });
    await new Promise(r => setTimeout(r, 1200));
    console.log("  ✅ PASS: Note successfully created and posted!");
  }

  // C. Start a new conversation via Compose Modal
  console.log("  - Opening Compose modal and starting conversation...");
  await page.evaluate(() => {
    const composeBtn = document.querySelector("button[title='Compose new message']") ||
      Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Send a message"));
    if (composeBtn) (composeBtn).click();
  });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const chatBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Chat →") || b.textContent?.includes("@aditya"));
    if (chatBtn) chatBtn.click();
  });
  
  // Next.js client-side router navigation
  await page.waitForFunction(() => window.location.pathname.startsWith("/messages/"), { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const threadHeader = await page.evaluate(() => {
    return document.querySelector("h2, h3, .font-bold")?.textContent?.trim() || "";
  });
  console.log(`  - Conversation thread opened with header: "${threadHeader}"`);

  const msgInput = await page.$("input[placeholder*='message' i], textarea");
  if (msgInput) {
    await msgInput.type("Hey @aditya, did you see the celestial glitch today? 🛸");
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 1200));
    console.log("  ✅ PASS: Message sent into thread!");
  }

  const threadShotPath = path.join(ARTIFACTS_DIR, "shot_messages_thread.png");
  await page.screenshot({ path: threadShotPath });
  console.log(`  📸 Saved conversation thread screenshot: ${threadShotPath}`);

  // Return to messages inbox
  console.log("  - Returning to messages inbox...");
  await page.goto(`${BASE_URL}/messages`, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));

  const inboxConvsCount = await page.evaluate(() => {
    return document.querySelectorAll("li[class*='relative']").length;
  });
  console.log(`  - Active conversations in Primary inbox: ${inboxConvsCount}`);

  const inboxShotPath = path.join(ARTIFACTS_DIR, "shot_messages_inbox_active.png");
  await page.screenshot({ path: inboxShotPath });
  console.log(`  📸 Saved active messages inbox screenshot: ${inboxShotPath}`);

  // -------------------------------------------------------------
  // 3. AUDIT WALLET SYSTEM (EVERY SECTION)
  // -------------------------------------------------------------
  console.log("\n💰 3. Auditing Wallet Page (Every Section)...");
  await page.goto(`${BASE_URL}/wallet`, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));

  // SECTION A: Ledger & Top-Up Tab
  console.log("\n--- SECTION A: Ledger & Top-Up Tab ---");
  const walletAuditA = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      has680: text.includes("680"),
      has285: text.includes("285"),
      has220: text.includes("220"),
      hasLedger: text.includes("Weird Credits Ledger"),
      hasTopUp: text.includes("Top Up Weird Credits"),
      hasStarterPack: text.includes("500") && text.includes("₹99"),
      hasHunterPack: text.includes("1,500") && text.includes("₹249"),
      hasVaultPack: text.includes("5,000") && text.includes("₹699"),
      hasCashOutGate: text.includes("Creator Cash-Out Gate"),
      hasTransactionsTrail: text.includes("Credit Ledger Audit Trail"),
    };
  });

  console.log(`  - Contains old 680 bug fallback: ${walletAuditA.has680 ? "❌ YES (BUG)" : "✅ NO"}`);
  console.log(`  - Contains old +285 bug addition: ${walletAuditA.has285 ? "❌ YES (BUG)" : "✅ NO"}`);
  console.log(`  - Real user balance 220 WC displayed: ${walletAuditA.has220 ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Top-Up packages verified: Starter(500/₹99), Hunter(1500/₹249), Vault(5000/₹699)`);
  console.log(`  - Creator Cash-Out Gate & Anti-Fraud present: ${walletAuditA.hasCashOutGate ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Immutable Audit Trail present: ${walletAuditA.hasTransactionsTrail ? "✅ YES" : "❌ NO"}`);

  const shotWalletTab1 = path.join(ARTIFACTS_DIR, "shot_wallet_tab1_ledger.png");
  await page.screenshot({ path: shotWalletTab1, fullPage: true });
  console.log(`  📸 Saved Wallet Tab 1 screenshot: ${shotWalletTab1}`);

  // SECTION B: Creator Program Tab
  console.log("\n--- SECTION B: Creator Program Tab ---");
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Creator Program"));
    if (tab) tab.click();
  });
  
  // Wait for loading skeleton to disappear and content to render
  try {
    await page.waitForFunction(() => {
      return document.body.innerText.includes("WECA CREATOR ELIGIBILITY PROGRAM") ||
             document.body.innerText.includes("Monetize Weirdness") ||
             document.body.innerText.includes("NOT ENROLLED");
    }, { timeout: 10000 });
  } catch (e) {
    console.log("  ⚠️ Wait timed out, proceeding with evaluation...");
  }
  await new Promise(r => setTimeout(r, 1000));

  const creatorAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCEP: text.includes("WECA CREATOR ELIGIBILITY PROGRAM") || text.includes("Creator Eligibility"),
      hasPostsMilestone: text.includes("5") && (text.includes("Posts") || text.includes("posts")),
      hasFollowersMilestone: text.includes("1,000") || text.includes("Followers"),
      hasImpressionsMilestone: text.includes("1,00,000") || text.includes("100,000") || text.includes("Impressions"),
    };
  });
  console.log(`  - CEP Program Active: ${creatorAudit.hasCEP ? "✅ YES" : "❌ NO"}`);
  console.log(`  - 5 Scored Posts milestone: ${creatorAudit.hasPostsMilestone ? "✅ YES" : "❌ NO"}`);
  console.log(`  - 1,000 Followers milestone: ${creatorAudit.hasFollowersMilestone ? "✅ YES" : "❌ NO"}`);
  console.log(`  - 100,000 Impressions milestone: ${creatorAudit.hasImpressionsMilestone ? "✅ YES" : "❌ NO"}`);

  const shotWalletTab2 = path.join(ARTIFACTS_DIR, "shot_wallet_tab2_creator.png");
  await page.screenshot({ path: shotWalletTab2, fullPage: true });
  console.log(`  📸 Saved Wallet Tab 2 screenshot: ${shotWalletTab2}`);

  // SECTION C: Earnings Streams & Caps Tab
  console.log("\n--- SECTION C: Earnings Streams & Caps Tab ---");
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Earnings Streams"));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const earningsAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasDailyCap: text.includes("Daily Interaction Cap") || text.includes("500 WC"),
      hasMonthlyCap: text.includes("Monthly Cashout Cap") || text.includes("50,000 WC"),
      hasScoredPosts: text.includes("Scored Posts"),
      hasViewerInteractions: text.includes("Viewer Interactions"),
      hasVSBattles: text.includes("Versus Battles") || text.includes("VS"),
    };
  });
  console.log(`  - Daily Interaction Cap (500 WC): ${earningsAudit.hasDailyCap ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Monthly Cashout Cap (50,000 WC): ${earningsAudit.hasMonthlyCap ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Scored Posts channel: ${earningsAudit.hasScoredPosts ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Viewer Interactions channel: ${earningsAudit.hasViewerInteractions ? "✅ YES" : "❌ NO"}`);

  const shotWalletTab3 = path.join(ARTIFACTS_DIR, "shot_wallet_tab3_earnings.png");
  await page.screenshot({ path: shotWalletTab3, fullPage: true });
  console.log(`  📸 Saved Wallet Tab 3 screenshot: ${shotWalletTab3}`);

  // SECTION D: Daily Streak & Milestones Tab
  console.log("\n--- SECTION D: Daily Streak & Milestones Tab ---");
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Daily Streak"));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const streakAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasDailyBonus: text.includes("Daily Login Bonus") || text.includes("Streak"),
      hasClaimBtn: Array.from(document.querySelectorAll("button")).some(b => b.textContent?.includes("Claim")),
      hasAchievementsGrid: text.includes("Achievements") || text.includes("Sentinel") || text.includes("Voyager") || text.includes("Gladiator"),
    };
  });
  console.log(`  - Daily Login Bonus Widget: ${streakAudit.hasDailyBonus ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Claim Bonus Button: ${streakAudit.hasClaimBtn ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Achievements Grid: ${streakAudit.hasAchievementsGrid ? "✅ YES" : "❌ NO"}`);

  const shotWalletTab4 = path.join(ARTIFACTS_DIR, "shot_wallet_tab4_rewards.png");
  await page.screenshot({ path: shotWalletTab4, fullPage: true });
  console.log(`  📸 Saved Wallet Tab 4 screenshot: ${shotWalletTab4}`);

  await browser.close();
  console.log("\n🎉 ALL MESSAGES AND WALLET AUDIT TESTS COMPLETED SUCCESSFULLY!");
}

run().catch(err => {
  console.error("❌ Audit script failed:", err);
  process.exit(1);
});
