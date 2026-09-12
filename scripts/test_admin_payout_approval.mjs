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

async function testAdminPayoutApproval() {
  console.log("===============================================================================");
  console.log("             WECA AUDIT: APPROVE PAYOUT REQUEST FROM ADMIN VIEW               ");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1000"],
    defaultViewport: { width: 1280, height: 1000 },
  });

  const page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[Browser Error]:", msg.text());
  });

  const targetRequestId = "3af44965-fce5-428b-bae0-8e85a27fe2ad";
  const auditReport = {
    targetRequestId,
    adminEmail: "admin@weca.app",
    statusBefore: null,
    statusAfter: null,
    processedAt: null,
    processedBy: null,
    adminNotes: null,
    razorpayxPayoutId: null,
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Check initial DB status
    // -------------------------------------------------------------------------
    const { data: initialRow } = await admin
      .from("payout_requests")
      .select("*")
      .eq("id", targetRequestId)
      .single();

    auditReport.statusBefore = initialRow?.status;
    console.log(`Initial Payout Request Status in DB: ${auditReport.statusBefore}`);

    // -------------------------------------------------------------------------
    // STEP 1: Log in with Admin Account (admin@weca.app)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 1: Logging in as admin@weca.app...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));

    // Clear and enter credentials
    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    const emailInput = await page.$("input[type='email'], input[placeholder*='you@example.com']");
    await emailInput.click({ clickCount: 3 });
    await emailInput.type("admin@weca.app");

    const passInput = await page.$("input[type='password']");
    await passInput.click({ clickCount: 3 });
    await passInput.type("Password123!");

    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2500));
    console.log("✅ Admin logged in.");

    // -------------------------------------------------------------------------
    // STEP 2: Navigate to /admin/payouts
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 2: Navigating to Admin Payout Review Desk (/admin/payouts)...");
    await page.goto("http://localhost:3000/admin/payouts", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));

    // Verify desk loaded
    const deskLoaded = await page.evaluate(() => {
      return document.body.innerText.includes("Payout Review Desk");
    });
    console.log(`Payout Review Desk Loaded: ${deskLoaded}`);

    // Verify pending request is listed
    const isTargetRequestPresent = await page.evaluate((reqIdShort) => {
      return document.body.innerText.includes(reqIdShort);
    }, targetRequestId.slice(0, 8));

    console.log(`Target Request #${targetRequestId.slice(0, 8)} listed in Pending view: ${isTargetRequestPresent}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_admin_1_pending_queue.png") });
    console.log("Saved screenshot: step_admin_1_pending_queue.png");

    // -------------------------------------------------------------------------
    // STEP 3: Click "Approve & Pay" to open action modal
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 3: Opening Approve modal for target request...");
    const clickedApprove = await page.evaluate((reqIdShort) => {
      const cards = Array.from(document.querySelectorAll("div.p-5"));
      const card = cards.find((c) => c.innerText.includes(reqIdShort));
      if (!card) return false;
      const approveBtn = Array.from(card.querySelectorAll("button")).find((b) => b.innerText.includes("Approve"));
      if (approveBtn) {
        approveBtn.click();
        return true;
      }
      return false;
    }, targetRequestId.slice(0, 8));

    console.log(`Clicked Approve Button: ${clickedApprove}`);
    await new Promise((r) => setTimeout(r, 1000));

    // Verify modal is open
    const modalVisible = await page.evaluate(() => {
      return document.body.innerText.includes("Approve Payout Request");
    });
    console.log(`Approve Confirmation Modal Visible: ${modalVisible}`);

    // Enter admin audit note
    const notesTextarea = await page.waitForSelector("textarea", { timeout: 5000 });
    await notesTextarea.type("Observational candor verified. Approved by Lead Curator via Weca Admin Desk.");
    await new Promise((r) => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_admin_2_action_modal.png") });
    console.log("Saved screenshot: step_admin_2_action_modal.png");

    // -------------------------------------------------------------------------
    // STEP 4: Confirm Approval ("Authorize & Pay")
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 4: Submitting approval authorization...");
    const clickedAuthorize = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.innerText.includes("Authorize & Pay"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log(`Clicked Authorize & Pay: ${clickedAuthorize}`);
    await new Promise((r) => setTimeout(r, 3500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_admin_3_approved_banner.png") });
    console.log("Saved screenshot: step_admin_3_approved_banner.png");

    // Switch to Completed tab to show settled status
    console.log("\n>>> STEP 5: Viewing Completed / Paid tab...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const completedTab = btns.find((b) => b.innerText.includes("Completed"));
      if (completedTab) completedTab.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_admin_4_completed_tab.png") });
    console.log("Saved screenshot: step_admin_4_completed_tab.png");

    // -------------------------------------------------------------------------
    // STEP 6: Confirm DB Status Update in Supabase payout_requests table
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 6: Querying payout_requests table in database...");
    const { data: updatedRow, error: uErr } = await admin
      .from("payout_requests")
      .select("*")
      .eq("id", targetRequestId)
      .single();

    if (uErr || !updatedRow) {
      throw new Error(`Failed to query updated payout request: ${uErr?.message}`);
    }

    auditReport.statusAfter = updatedRow.status;
    auditReport.processedAt = updatedRow.processed_at;
    auditReport.processedBy = updatedRow.processed_by;
    auditReport.adminNotes = updatedRow.admin_notes;
    auditReport.razorpayxPayoutId = updatedRow.razorpayx_payout_id;

    console.log("\n✅ Updated Database Record:");
    console.log(`- Request ID: ${updatedRow.id}`);
    console.log(`- Previous Status: ${auditReport.statusBefore}`);
    console.log(`- New Status: ${auditReport.statusAfter}`);
    console.log(`- Processed At: ${auditReport.processedAt}`);
    console.log(`- Processed By: ${auditReport.processedBy}`);
    console.log(`- Admin Notes: ${auditReport.adminNotes}`);
    console.log(`- RazorpayX Payout ID: ${auditReport.razorpayxPayoutId}`);

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin_payout_approval_results.json"),
      JSON.stringify(auditReport, null, 2)
    );
    console.log("\nSaved admin_payout_approval_results.json!");

  } catch (err) {
    console.error("\n❌ Error during test:", err);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_admin_error.png") }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

testAdminPayoutApproval();
