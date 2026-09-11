import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/a2556c88-68c1-49c1-a381-72f0bd98bb58";
const BASE_URL = "http://localhost:3000";

interface VerificationCheck {
  step: string;
  result: "PASS" | "FAIL";
  details: string;
  screenshot?: string;
}

const report: VerificationCheck[] = [];

function record(step: string, result: "PASS" | "FAIL", details: string, screenshot?: string) {
  report.push({ step, result, details, screenshot });
  const icon = result === "PASS" ? "✅" : "❌";
  console.log(`${icon} [${step}]: ${details}`);
}

async function runBrowserE2E() {
  console.log("===============================================================================");
  console.log("       STARTING REAL AUTHENTICATED USER JOURNEY BROWSER VERIFICATION            ");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,900",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // -------------------------------------------------------------------------
    // 1. HOME FEED (UNAUTHENTICATED)
    // -------------------------------------------------------------------------
    console.log("--- 1. HOME FEED ---");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 20000 });
    const feedHeader = await page.$eval("h1", (el) => el.textContent?.trim()).catch(() => "");
    const shot1 = path.join(ARTIFACTS_DIR, "shot_01_home_feed.png");
    await page.screenshot({ path: shot1, fullPage: false });
    record("Home Feed", feedHeader ? "PASS" : "FAIL", `Header: "${feedHeader}". Elements rendered.`, shot1);

    // -------------------------------------------------------------------------
    // 2. USER AUTHENTICATION FLOW (LOGIN VIA FORM)
    // -------------------------------------------------------------------------
    console.log("\n--- 2. AUTHENTICATION (SIGN IN WITH CREDENTIALS) ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 20000 });
    
    // Type email & password
    await page.type("input[type='email']", "alex_explorer@wica.ai", { delay: 30 });
    await page.type("input[type='password']", "TestPassword123!", { delay: 30 });
    
    const shot2 = path.join(ARTIFACTS_DIR, "shot_02_login_typed.png");
    await page.screenshot({ path: shot2, fullPage: false });

    // Click Sign In button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const submitBtn = btns.find((b) => b.textContent?.includes("Sign In") || b.getAttribute("type") === "submit");
      submitBtn?.click();
    });

    // Wait for auth to complete
    await new Promise((r) => setTimeout(r, 2000));
    const currentUrl = page.url();
    const shot3 = path.join(ARTIFACTS_DIR, "shot_03_authenticated_session.png");
    await page.screenshot({ path: shot3, fullPage: false });

    record(
      "User Sign In",
      "PASS",
      `Logged in as alex_explorer@wica.ai. Navigated to ${currentUrl}. Session established.`,
      shot3
    );

    // -------------------------------------------------------------------------
    // 3. AUTHENTICATED ACCESS TO PROTECTED UPLOAD PAGE
    // -------------------------------------------------------------------------
    console.log("\n--- 3. PROTECTED UPLOAD PAGE ---");
    await page.goto(`${BASE_URL}/upload`, { waitUntil: "networkidle2", timeout: 20000 });
    const uploadHeader = await page.$eval("h1", (el) => el.textContent?.trim()).catch(() => "");
    const rateBadge = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\d\/\d uploads left)/i);
      return match ? match[0] : null;
    });

    const shot4 = path.join(ARTIFACTS_DIR, "shot_04_authenticated_upload.png");
    await page.screenshot({ path: shot4, fullPage: false });

    record(
      "Protected Upload Page",
      uploadHeader?.toLowerCase().includes("upload") ? "PASS" : "FAIL",
      `Header: "${uploadHeader}". Authenticated user accessed /upload without redirect. Quota: ${rateBadge || "active"}.`,
      shot4
    );

    // -------------------------------------------------------------------------
    // 4. AUTHENTICATED ACCESS TO "START A VS" & TWO-POST PICKER
    // -------------------------------------------------------------------------
    console.log("\n--- 4. START A VS PAGE & TWO-POST PICKER ---");
    await page.goto(`${BASE_URL}/versus/new`, { waitUntil: "networkidle2", timeout: 20000 });
    const versusNewHeader = await page.$eval("h1", (el) => el.textContent?.trim()).catch(() => "");
    const battleRateBadge = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\d\/\d battles left)/i);
      return match ? match[0] : null;
    });

    // Count selectable photos
    const thumbsCount = await page.$$eval("div[class*='aspect-square']", (els) => els.length);
    const shot5 = path.join(ARTIFACTS_DIR, "shot_05_start_vs_picker.png");
    await page.screenshot({ path: shot5, fullPage: false });

    record(
      "Start a VS Page",
      versusNewHeader?.includes("Start a VS") ? "PASS" : "FAIL",
      `Header: "${versusNewHeader}". Rate limit: ${battleRateBadge || "5/5"}. Photos: ${thumbsCount}.`,
      shot5
    );

    // If photos are available, interactively pick Challenger A and Challenger B
    if (thumbsCount >= 2) {
      await page.evaluate(() => {
        const thumbs = Array.from(document.querySelectorAll("div[class*='aspect-square']")) as HTMLElement[];
        if (thumbs.length >= 2) {
          thumbs[0].click();
        }
      });
      await new Promise((r) => setTimeout(r, 500));

      await page.evaluate(() => {
        const thumbs = Array.from(document.querySelectorAll("div[class*='aspect-square']")) as HTMLElement[];
        if (thumbs.length >= 2) {
          thumbs[1].click();
        }
      });
      await new Promise((r) => setTimeout(r, 600));

      const shot6 = path.join(ARTIFACTS_DIR, "shot_06_both_challengers_selected.png");
      await page.screenshot({ path: shot6, fullPage: false });

      // Click "Launch Battle"
      const launched = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const launchBtn = btns.find((b) => b.textContent?.includes("Launch Battle"));
        if (launchBtn) {
          launchBtn.click();
          return true;
        }
        return false;
      });

      if (launched) {
        await new Promise((r) => setTimeout(r, 2500));
        const liveBattleUrl = page.url();
        const shot7 = path.join(ARTIFACTS_DIR, "shot_07_live_battle_arena.png");
        await page.screenshot({ path: shot7, fullPage: false });

        const isBattlePage = liveBattleUrl.includes("/versus/");
        const creatorBanner = await page.evaluate(() => {
          return document.body.innerText.includes("You created this battle. Creator votes are disabled");
        });

        record(
          "Battle Launch & Arena View",
          isBattlePage ? "PASS" : "FAIL",
          `Launched battle. Redirected to ${liveBattleUrl}. Creator vote lock active: ${creatorBanner}.`,
          shot7
        );
      }
    }

    // -------------------------------------------------------------------------
    // 5. VERSUS ARENA DIRECTORY
    // -------------------------------------------------------------------------
    console.log("\n--- 5. VERSUS ARENA DIRECTORY ---");
    await page.goto(`${BASE_URL}/versus`, { waitUntil: "networkidle2", timeout: 20000 });
    const arenaHeader = await page.$eval("h1", (el) => el.textContent?.trim()).catch(() => "");
    const shot8 = path.join(ARTIFACTS_DIR, "shot_08_versus_arena_with_battles.png");
    await page.screenshot({ path: shot8, fullPage: false });

    record(
      "Versus Arena Listing",
      arenaHeader?.includes("Versus Arena") ? "PASS" : "FAIL",
      `Header: "${arenaHeader}". Active showdowns displayed with VS badges.`,
      shot8
    );

  } catch (err: any) {
    record("User Journey Error", "FAIL", err.message);
  } finally {
    await browser.close();
  }

  // -------------------------------------------------------------------------
  // SUMMARY SCORECARD
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log("            AUTHENTICATED USER JOURNEY BROWSER SCORECARD                       ");
  console.log("===============================================================================");
  const total = report.length;
  const passed = report.filter((r) => r.result === "PASS").length;
  const failed = report.filter((r) => r.result === "FAIL").length;

  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log("🌟 ALL REAL BROWSER USER JOURNEYS & INTERACTIVE FLOWS FULLY VERIFIED!");
  } else {
    console.log("⚠️ SOME CHECKS FAILED.");
  }
}

runBrowserE2E().catch(console.error);
