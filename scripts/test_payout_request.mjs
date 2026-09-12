import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/12e40bd2-ee48-4afc-82ce-c8def1a5bbdb";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Parse environment variables
const envPath = path.resolve(".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const t = line.trim();
  if (!t || t.startsWith("#")) return;
  const idx = t.indexOf("=");
  if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testPayoutRequestFlow() {
  console.log("===============================================================================");
  console.log("             WECA AUDIT: TRIGGER PAYOUT REQUEST (LOWERED THRESHOLD)            ");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,960"],
    defaultViewport: { width: 1280, height: 960 },
  });

  const page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[Browser Error]:", msg.text());
  });

  const auditReport = {
    account: "account3@weca.test",
    username: "voter_three",
    thresholdWC: 50,
    startingBalanceWC: null,
    requestedPayoutAmountWC: 50,
    finalBalanceWC: null,
    payoutRequestId: null,
    payoutRequestRow: null,
    creditTransactionRow: null,
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Log in with Account 3 (voter_three)
    // -------------------------------------------------------------------------
    console.log(">>> STEP 1: Logging in as account3@weca.test (@voter_three)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account3@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2500));
    console.log("Logged in successfully. Navigating to /wallet...");

    // -------------------------------------------------------------------------
    // STEP 2: Navigate to /wallet & verify "Request Payout" is unlocked
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 2: Checking /wallet eligibility with lowered threshold (50 WC)...");
    await page.goto("http://localhost:3000/wallet", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));

    const { data: profileBefore } = await admin
      .from("profiles")
      .select("id, username, credits_balance")
      .eq("username", "voter_three")
      .single();

    auditReport.startingBalanceWC = profileBefore?.credits_balance || 0;
    console.log(`Starting Profile Balance: ${auditReport.startingBalanceWC} WC`);

    const walletUIState = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const requestPayoutBtn = btns.find((b) => b.innerText.includes("Request Payout"));
      const initiatePayoutBtn = btns.find((b) => b.innerText.includes("Initiate Payout") || b.innerText.includes("Requires"));
      
      const text = document.body.innerText;
      const eligibleText = text.includes("Eligible");
      const minBalanceText = text.includes("Min. 50 WC Balance");

      return {
        requestPayoutBtnFound: !!requestPayoutBtn,
        requestPayoutBtnText: requestPayoutBtn ? requestPayoutBtn.innerText : null,
        requestPayoutBtnDisabled: requestPayoutBtn ? requestPayoutBtn.disabled : null,
        initiatePayoutBtnFound: !!initiatePayoutBtn,
        initiatePayoutBtnText: initiatePayoutBtn ? initiatePayoutBtn.innerText : null,
        initiatePayoutBtnDisabled: initiatePayoutBtn ? initiatePayoutBtn.disabled : null,
        eligibleText,
        minBalanceText,
      };
    });

    console.log("Wallet UI State:", walletUIState);
    if (walletUIState.requestPayoutBtnDisabled) {
      throw new Error("Request Payout button is disabled despite balance >= threshold!");
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_payout_1_eligible.png") });
    console.log("Saved screenshot: step_payout_1_eligible.png");

    // -------------------------------------------------------------------------
    // STEP 3: Click "Request Payout" to Open Modal
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 3: Clicking 'Request Payout' to open payout modal...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.innerText.includes("Request Payout") && !b.disabled);
      if (btn) btn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Verify modal is open
    const modalVisible = await page.evaluate(() => {
      return document.body.innerText.includes("Request Cash-Out Payout");
    });
    console.log("Modal visible:", modalVisible);

    // -------------------------------------------------------------------------
    // STEP 4: Fill Modal Form with Test UPI Details
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 4: Filling in test UPI payout details...");

    // Fill Name
    const nameInput = await page.waitForSelector("input[placeholder*='Alex Hunter']", { timeout: 5000 });
    await nameInput.click({ clickCount: 3 });
    await nameInput.type("Voter Three Test");

    // Fill UPI ID
    const upiInput = await page.waitForSelector("input[placeholder*='alex@okhdfcbank']", { timeout: 5000 });
    await upiInput.click({ clickCount: 3 });
    await upiInput.type("voter3@okhdfcbank");

    // Set withdraw amount slider to 50 WC
    await page.evaluate(() => {
      const rangeInput = document.querySelector("input[type='range']");
      if (rangeInput) {
        rangeInput.value = "50";
        rangeInput.dispatchEvent(new Event("input", { bubbles: true }));
        rangeInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_payout_2_modal_filled.png") });
    console.log("Saved screenshot: step_payout_2_modal_filled.png");

    // -------------------------------------------------------------------------
    // STEP 5: Submit Payout Request
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 5: Submitting payout request...");
    const submitBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.innerText.includes("Submit Request"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log("Clicked Submit Request:", submitBtn);
    await new Promise((r) => setTimeout(r, 3500));

    // Reload page or wait for reactive refresh
    await page.goto("http://localhost:3000/wallet", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_payout_3_submitted.png") });
    console.log("Saved screenshot: step_payout_3_submitted.png");

    // -------------------------------------------------------------------------
    // STEP 6: Verify Database Records (payout_requests & credit_transactions)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 6: Verifying database records...");

    const { data: latestPayout, error: pErr } = await admin
      .from("payout_requests")
      .select("*")
      .eq("user_id", profileBefore.id)
      .order("requested_at", { ascending: false })
      .limit(1)
      .single();

    if (pErr || !latestPayout) {
      throw new Error(`Failed to find newly created payout request: ${pErr?.message}`);
    }

    auditReport.payoutRequestId = latestPayout.id;
    auditReport.payoutRequestRow = latestPayout;
    console.log("✅ Payout Request Record:", {
      id: latestPayout.id,
      amount: latestPayout.amount,
      status: latestPayout.status,
      method: latestPayout.payout_details?.method,
      upi_id: latestPayout.payout_details?.upi_id,
      risk_score: latestPayout.risk_score,
      requested_at: latestPayout.requested_at,
    });

    const { data: latestTx, error: txErr } = await admin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", profileBefore.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (txErr || !latestTx) {
      throw new Error(`Failed to find newly created credit transaction: ${txErr?.message}`);
    }

    auditReport.creditTransactionRow = latestTx;
    console.log("✅ Credit Transaction Record:", {
      id: latestTx.id,
      amount: latestTx.amount,
      reason: latestTx.reason,
      payout_request_id: latestTx.payout_request_id,
      created_at: latestTx.created_at,
    });

    const { data: profileAfter } = await admin
      .from("profiles")
      .select("id, username, credits_balance")
      .eq("id", profileBefore.id)
      .single();

    auditReport.finalBalanceWC = profileAfter?.credits_balance || 0;
    console.log(`Updated Profile Balance: ${auditReport.finalBalanceWC} WC (Expected: ${auditReport.startingBalanceWC - auditReport.requestedPayoutAmountWC} WC)`);

    // Write audit results
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "payout_request_audit_results.json"),
      JSON.stringify(auditReport, null, 2)
    );
    console.log("\nSaved payout_request_audit_results.json!");

  } catch (err) {
    console.error("\n❌ Error during test:", err);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_payout_error.png") }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

testPayoutRequestFlow();
