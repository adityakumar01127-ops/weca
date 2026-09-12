import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/12e40bd2-ee48-4afc-82ce-c8def1a5bbdb";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BATTLE_ID = "325a402a-76be-43be-bffe-875a8e469407";
const BATTLE_URL = `http://localhost:3000/versus/${BATTLE_ID}`;

async function testVotingRules() {
  console.log("===============================================================================");
  console.log("             WECA VOTING RULES AUDIT: PREVENT DOUBLE & CREATOR VOTE            ");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,960"],
    defaultViewport: { width: 1280, height: 960 },
  });

  const page = await browser.newPage();

  const auditReport = {
    battleId: BATTLE_ID,
    doubleVotingTest: {
      account: "account2@weca.test",
      uiButtonsAbsent: false,
      apiCallBlocked: false,
      apiErrorMessage: null,
      statusCode: null,
    },
    creatorVotingTest: {
      account: "account1@weca.test",
      creatorBannerVisible: false,
      uiButtonsAbsent: false,
      apiCallBlocked: false,
      apiErrorMessage: null,
      statusCode: null,
    },
  };

  try {
    // -------------------------------------------------------------------------
    // TEST PART 1: DOUBLE VOTING PREVENTED (Account 2)
    // -------------------------------------------------------------------------
    console.log(">>> [RULE 1] Testing Duplicate Vote Prevention with Account 2...");
    
    // Login as Account 2
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account2@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2000));

    // Navigate to battle page
    await page.goto(BATTLE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Check UI: Vote buttons must NOT be present because Account 2 already voted
    const uiVoteButtonsAcc2 = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.filter((b) => b.innerText.includes("Vote for Challenger")).map((b) => b.innerText);
    });

    auditReport.doubleVotingTest.uiButtonsAbsent = uiVoteButtonsAcc2.length === 0;
    console.log(`UI Check: Vote buttons visible for Account 2? ${uiVoteButtonsAcc2.length > 0 ? "YES (FAILED)" : "NO (LOCKED - PASS)"}`);

    // Take screenshot of Account 2 state
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "rule_check_account2_locked.png") });
    console.log("Saved screenshot: rule_check_account2_locked.png");

    // Attempt direct API vote as Account 2 (trying to vote for Challenger B)
    console.log("Attempting direct vote submission via API as Account 2...");
    const apiResultAcc2 = await page.evaluate(async (battleId) => {
      // First get battle details to find Challenger B's ID
      const battleRes = await fetch(`/api/battles?status=active`);
      const battleJson = await battleRes.json();
      const currentBattle = battleJson.battles?.find((b) => b.id === battleId);
      const postBId = currentBattle?.post_b_id;

      const res = await fetch("/api/battles/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle_id: battleId,
          voted_for_post_id: postBId,
        }),
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, data };
    }, BATTLE_ID);

    console.log("API Response for duplicate vote:", apiResultAcc2);
    auditReport.doubleVotingTest.statusCode = apiResultAcc2.status;
    auditReport.doubleVotingTest.apiErrorMessage = apiResultAcc2.data.error;
    auditReport.doubleVotingTest.apiCallBlocked = !apiResultAcc2.ok && !apiResultAcc2.data.success;

    console.log("-------------------------------------------------------------------------------");
    console.log("                   DOUBLE VOTING TEST RESULTS                                  ");
    console.log("-------------------------------------------------------------------------------");
    console.log("• UI Action Buttons Hidden :", auditReport.doubleVotingTest.uiButtonsAbsent ? "✅ PASS" : "❌ FAIL");
    console.log("• API HTTP Status Code     :", apiResultAcc2.status === 400 ? `✅ 400 Bad Request (PASS)` : `❌ ${apiResultAcc2.status}`);
    console.log("• API Error Message        :", `"${apiResultAcc2.data.error}"`);
    console.log("• Duplicate Vote Blocked   :", auditReport.doubleVotingTest.apiCallBlocked ? "✅ PASS (STRICTLY BLOCKED)" : "❌ FAILED");
    console.log("-------------------------------------------------------------------------------\n");

    // -------------------------------------------------------------------------
    // TEST PART 2: CREATOR VOTING PREVENTED (Account 1)
    // -------------------------------------------------------------------------
    console.log(">>> [RULE 2] Testing Creator Vote Prevention with Account 1...");

    // Clear session and cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const cdp = await page.target().createCDPSession();
    await cdp.send("Network.clearBrowserCookies");
    await cdp.send("Network.clearBrowserCache");

    // Login as Account 1 (Creator)
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account1@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2000));

    // Navigate to battle page
    await page.goto(BATTLE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Check UI: Creator banner and absence of voting buttons
    const creatorUiCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const banner = text.includes("You created this battle. Creator votes are disabled to prevent bias");
      const btns = Array.from(document.querySelectorAll("button")).filter((b) => b.innerText.includes("Vote for Challenger"));
      return { banner, voteBtnCount: btns.length };
    });

    auditReport.creatorVotingTest.creatorBannerVisible = creatorUiCheck.banner;
    auditReport.creatorVotingTest.uiButtonsAbsent = creatorUiCheck.voteBtnCount === 0;

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "rule_check_creator_locked.png") });
    console.log("Saved screenshot: rule_check_creator_locked.png");

    // Attempt direct API vote as Account 1 (Creator attempting to vote)
    console.log("Attempting direct vote submission via API as Creator (Account 1)...");
    const apiResultCreator = await page.evaluate(async (battleId) => {
      const battleRes = await fetch(`/api/battles?status=active`);
      const battleJson = await battleRes.json();
      const currentBattle = battleJson.battles?.find((b) => b.id === battleId);
      const postAId = currentBattle?.post_a_id;

      const res = await fetch("/api/battles/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle_id: battleId,
          voted_for_post_id: postAId,
        }),
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, data };
    }, BATTLE_ID);

    console.log("API Response for creator vote:", apiResultCreator);
    auditReport.creatorVotingTest.statusCode = apiResultCreator.status;
    auditReport.creatorVotingTest.apiErrorMessage = apiResultCreator.data.error;
    auditReport.creatorVotingTest.apiCallBlocked = !apiResultCreator.ok && !apiResultCreator.data.success;

    console.log("-------------------------------------------------------------------------------");
    console.log("                   CREATOR VOTING TEST RESULTS                                 ");
    console.log("-------------------------------------------------------------------------------");
    console.log("• Creator Impartiality Notice :", auditReport.creatorVotingTest.creatorBannerVisible ? "✅ PASS" : "❌ FAIL");
    console.log("• UI Action Buttons Hidden    :", auditReport.creatorVotingTest.uiButtonsAbsent ? "✅ PASS" : "❌ FAIL");
    console.log("• API HTTP Status Code        :", apiResultCreator.status === 400 ? `✅ 400 Bad Request (PASS)` : `❌ ${apiResultCreator.status}`);
    console.log("• API Error Message           :", `"${apiResultCreator.data.error}"`);
    console.log("• Creator Vote Blocked        :", auditReport.creatorVotingTest.apiCallBlocked ? "✅ PASS (STRICTLY BLOCKED)" : "❌ FAILED");
    console.log("-------------------------------------------------------------------------------\n");

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "voting_rules_audit_results.json"),
      JSON.stringify(auditReport, null, 2)
    );
    console.log("Saved full report: voting_rules_audit_results.json");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
    console.log("=== VOTING RULES AUDIT FINISHED ===");
  }
}

testVotingRules();
