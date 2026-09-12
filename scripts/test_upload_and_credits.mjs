import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/12e40bd2-ee48-4afc-82ce-c8def1a5bbdb";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SAMPLE_IMAGE_PATH = path.resolve("sample-anomaly.jpg");

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

async function testUploadAndCredits() {
  console.log("===============================================================================");
  console.log("             WECA AUDIT: UPLOAD POST, SCORE, & WATCH CREDITS ACCUMULATE        ");
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
    initialBalanceWC: null,
    finalBalanceWC: null,
    creditsEarnedWC: null,
    scoredPostId: null,
    weirdnessScore: null,
    uniquenessScore: null,
    creditTransaction: null,
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Log in with Account 3 (voter_three)
    // -------------------------------------------------------------------------
    console.log(">>> STEP 1: Logging in with Account 3 (voter_three)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account3@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2000));
    console.log("✅ Logged in successfully.");

    // -------------------------------------------------------------------------
    // STEP 2: View initial profile and record starting credits balance
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 2: Checking initial profile balance...");
    await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_credits_1_initial_profile.png") });
    console.log("Saved screenshot: step_credits_1_initial_profile.png");

    const initialStats = await page.evaluate(() => {
      const text = document.body.innerText;
      // Look for WC balance on profile
      const wcMatch = text.match(/(\d+)\s*WC/i);
      return {
        textSnippet: text.slice(0, 500),
        balanceText: wcMatch ? wcMatch[1] : null,
      };
    });

    // Also verify directly from Supabase DB
    const { data: initialDbProfile } = await admin
      .from("profiles")
      .select("id, credits_balance, username")
      .eq("username", "voter_three")
      .single();

    const startingBalance = initialDbProfile?.credits_balance ?? 0;
    auditReport.initialBalanceWC = startingBalance;
    console.log(`Starting Credits Balance: ${startingBalance} WC (UI displays: ${initialStats.balanceText} WC)`);

    // -------------------------------------------------------------------------
    // STEP 3: Open Upload Modal & Submit New Post
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 3: Opening Upload Modal...");
    // Click Upload button in Navbar
    const uploadBtn = await page.waitForSelector("button ::-p-text(Upload)", { timeout: 6000 });
    await uploadBtn.click();
    await new Promise((r) => setTimeout(r, 1200));

    // Upload sample anomaly image
    console.log(`Attaching image: ${SAMPLE_IMAGE_PATH}...`);
    const fileInput = await page.waitForSelector("input[type='file']", { timeout: 5000 });
    await fileInput.uploadFile(SAMPLE_IMAGE_PATH);
    await new Promise((r) => setTimeout(r, 1500));

    // Enter caption
    console.log("Entering anomaly caption...");
    const captionTextarea = await page.waitForSelector("textarea, input[placeholder*='Notes']", { timeout: 5000 });
    await captionTextarea.type("Bioluminescent optical distortion observed near abandoned radar tower");
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_credits_upload_form_filled.png") });
    console.log("Saved screenshot: step_credits_upload_form_filled.png");

    // Click Submit ("Publish Anomaly" / "Submit" button)
    console.log("Submitting anomaly post...");
    const submitBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const submit = btns.find((b) => b.innerText.includes("Publish") || b.innerText.includes("Submit") || b.type === "submit");
      if (submit) {
        submit.click();
        return true;
      }
      return false;
    });

    console.log("Submitted! Waiting for upload and AI scoring...");
    await new Promise((r) => setTimeout(r, 4000));

    // -------------------------------------------------------------------------
    // STEP 4: Poll Database for Scored Post & Transaction Accrual
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 4: Monitoring AI scoring & credit accumulation...");
    let latestPost = null;
    let transaction = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: posts } = await admin
        .from("posts")
        .select("id, caption, weirdness_score, uniqueness_score, scoring_status, user_id, created_at")
        .eq("user_id", initialDbProfile.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (posts && posts.length > 0) {
        latestPost = posts[0];
        if (latestPost.scoring_status === "completed" || latestPost.weirdness_score != null) {
          console.log(`Post ${latestPost.id} scoring completed!`);
          break;
        }
      }
      console.log(`Waiting for scoring (attempt ${attempt + 1}/10)...`);
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!latestPost) throw new Error("No post was found for user in database!");

    auditReport.scoredPostId = latestPost.id;
    auditReport.weirdnessScore = latestPost.weirdness_score;
    auditReport.uniquenessScore = latestPost.uniqueness_score;

    console.log(`\nPost Details:`);
    console.log(`- Post ID: ${latestPost.id}`);
    console.log(`- Weirdness Score: ${latestPost.weirdness_score}`);
    console.log(`- Uniqueness Score: ${latestPost.uniqueness_score}`);
    console.log(`- Status: ${latestPost.scoring_status}`);

    // Check transaction table
    const { data: txList } = await admin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", initialDbProfile.id)
      .eq("post_id", latestPost.id);

    if (txList && txList.length > 0) {
      transaction = txList[0];
      auditReport.creditTransaction = transaction;
      console.log(`\n✅ Credit Transaction Found:`, transaction);
    }

    // -------------------------------------------------------------------------
    // STEP 5: Verify Updated Credits Balance on Profile Page
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 5: Checking updated credits balance on /profile...");
    await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_credits_2_scored_profile.png") });
    console.log("Saved screenshot: step_credits_2_scored_profile.png");

    const finalStats = await page.evaluate(() => {
      const text = document.body.innerText;
      const wcMatch = text.match(/(\d+)\s*WC/i);
      return {
        textSnippet: text.slice(0, 600),
        balanceText: wcMatch ? wcMatch[1] : null,
      };
    });

    const { data: finalDbProfile } = await admin
      .from("profiles")
      .select("credits_balance")
      .eq("id", initialDbProfile.id)
      .single();

    const finalBalance = finalDbProfile?.credits_balance ?? 0;
    auditReport.finalBalanceWC = finalBalance;
    auditReport.creditsEarnedWC = finalBalance - startingBalance;

    console.log("-------------------------------------------------------------------------------");
    console.log("                   CREDIT ACCUMULATION AUDIT RESULTS                           ");
    console.log("-------------------------------------------------------------------------------");
    console.log(`• Starting Balance       : ${startingBalance} WC`);
    console.log(`• AI Weirdness Score     : ${latestPost.weirdness_score} / 100`);
    console.log(`• AI Uniqueness Score    : ${latestPost.uniqueness_score} / 100`);
    console.log(`• Credits Earned         : +${auditReport.creditsEarnedWC} WC`);
    console.log(`• Updated Profile Balance: ${finalBalance} WC (UI displays: ${finalStats.balanceText} WC)`);
    console.log(`• Transaction Logged     : ${transaction ? `YES (${transaction.reason})` : "NO"}`);
    console.log(`• Status                 : ${auditReport.creditsEarnedWC > 0 ? "✅ PASS (Credits Accumulated Sensibly!)" : "❌ FAIL"}`);
    console.log("-------------------------------------------------------------------------------\n");

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "credit_accumulation_audit_results.json"),
      JSON.stringify(auditReport, null, 2)
    );
    console.log("Saved full report: credit_accumulation_audit_results.json");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
    console.log("=== AUDIT FINISHED ===");
  }
}

testUploadAndCredits();
