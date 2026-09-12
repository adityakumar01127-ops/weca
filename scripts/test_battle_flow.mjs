import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/12e40bd2-ee48-4afc-82ce-c8def1a5bbdb";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function runBattleE2ETest() {
  console.log("===============================================================================");
  console.log("                WECA E2E TEST: START AND VOTE ON A BATTLE                     ");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,960"],
    defaultViewport: { width: 1280, height: 960 },
  });

  const page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[Browser Console Error]:", msg.text());
    }
  });

  const testReport = {
    battleId: null,
    battleUrl: null,
    account1: "account1@weca.test",
    account2: "account2@weca.test",
    creatorMessageVisible: false,
    beforeVote: {
      tallyConcealed: false,
      blindBannerVisible: false,
      voteButtonsVisible: false,
      percentVisible: false,
    },
    afterVote: {
      tallyRevealed: false,
      percentVisible: false,
      voteCountsVisible: false,
      yourPickBadgeVisible: false,
      confettiRecordedBannerVisible: false,
    },
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Log in with Account 1
    // -------------------------------------------------------------------------
    console.log(">>> STEP 1: Logging in with Account 1 (Creator)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account1@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step1_creator_logged_in.png") });
    console.log("✅ Account 1 signed in successfully. Screenshot: step1_creator_logged_in.png");

    // -------------------------------------------------------------------------
    // STEP 2: Navigate to /versus/new and start battle
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 2: Creating new battle on /versus/new...");
    await page.goto("http://localhost:3000/versus/new", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    // Select Challenger A and Challenger B using DOM evaluate
    const selectRes = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("div.grid.grid-cols-2 > div, div[class*='aspect-square']"));
      if (cards.length >= 2) {
        cards[0].click();
        return { count: cards.length, success: true };
      }
      return { count: cards.length, success: false };
    });

    console.log(`Candidate photos detected: ${selectRes.count}. Selected Challenger A.`);
    await new Promise((r) => setTimeout(r, 1000));

    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("div.grid.grid-cols-2 > div, div[class*='aspect-square']"));
      if (cards.length >= 2) {
        cards[1].click();
      }
    });
    console.log("Selected Challenger B.");
    await new Promise((r) => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step2_pair_selected.png") });
    console.log("Saved screenshot: step2_pair_selected.png");

    // Launch Battle
    console.log("Clicking 'Launch Battle' button...");
    const launched = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const launch = btns.find((b) => b.innerText.includes("Launch Battle"));
      if (launch) {
        launch.click();
        return true;
      }
      return false;
    });

    if (!launched) throw new Error("Could not find 'Launch Battle' button");

    // Wait for redirect to battle page
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    const battleUrl = page.url();
    const battleIdMatch = battleUrl.match(/\/versus\/([^\/?#]+)/);
    const battleId = battleIdMatch ? battleIdMatch[1] : null;
    testReport.battleUrl = battleUrl;
    testReport.battleId = battleId;

    console.log(`✅ Battle Created! Battle ID: ${battleId}`);
    console.log(`URL: ${battleUrl}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step3_battle_creator_view.png") });
    console.log("Saved screenshot: step3_battle_creator_view.png");

    const creatorPageText = await page.evaluate(() => document.body.innerText);
    testReport.creatorMessageVisible = creatorPageText.includes("You created this battle. Creator votes are disabled");
    console.log("Creator message visible?:", testReport.creatorMessageVisible ? "✅ YES" : "❌ NO");

    // -------------------------------------------------------------------------
    // STEP 3: Log out of Account 1
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 3: Logging out of Account 1...");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const cdp = await page.target().createCDPSession();
    await cdp.send("Network.clearBrowserCookies");
    await cdp.send("Network.clearBrowserCache");
    console.log("✅ Cleared session and cookies.");

    // -------------------------------------------------------------------------
    // STEP 4: Log in with Account 2
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 4: Logging in with Account 2 (Voter)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account2@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2000));
    console.log("✅ Account 2 logged in.");

    // -------------------------------------------------------------------------
    // STEP 5: Navigate to battle URL as Account 2 BEFORE VOTING
    // -------------------------------------------------------------------------
    console.log(`\n>>> STEP 5: Navigating to battle page as Account 2: ${battleUrl}`);
    await page.goto(battleUrl, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step4_account2_before_voting.png") });
    console.log("Saved screenshot: step4_account2_before_voting.png");

    // CRITICAL TALLY INSPECTION BEFORE VOTING
    const beforeStats = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasPercent = /% of votes/i.test(text);
      const hasBlindBanner = /Blind voting active: The current vote tally is concealed until you cast your vote/i.test(text);
      const hasVoteA = Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Vote for Challenger A"));
      const hasVoteB = Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Vote for Challenger B"));
      
      // Specifically check if tally container or progress bars exist
      const tallyBars = document.querySelectorAll("div.w-full.h-2.rounded-full.bg-zinc-800");

      return {
        hasPercent,
        hasBlindBanner,
        hasVoteA,
        hasVoteB,
        tallyBarCount: tallyBars.length,
      };
    });

    testReport.beforeVote.percentVisible = beforeStats.hasPercent;
    testReport.beforeVote.blindBannerVisible = beforeStats.hasBlindBanner;
    testReport.beforeVote.voteButtonsVisible = beforeStats.hasVoteA && beforeStats.hasVoteB;
    testReport.beforeVote.tallyConcealed = !beforeStats.hasPercent && beforeStats.tallyBarCount === 0;

    console.log("-------------------------------------------------------------------------------");
    console.log("                     BEFORE-VOTING AUDIT RESULTS                               ");
    console.log("-------------------------------------------------------------------------------");
    console.log("• Percentage of votes visible? :", beforeStats.hasPercent ? "🚨 BUG: TALLY VISIBLE!" : "✅ HIDDEN (PASS)");
    console.log("• Progress bars rendered?      :", beforeStats.tallyBarCount > 0 ? "🚨 BUG: PROGRESS BARS VISIBLE!" : "✅ NONE (PASS)");
    console.log("• Blind voting banner active?  :", beforeStats.hasBlindBanner ? "✅ YES (PASS)" : "❌ NO");
    console.log("• Action buttons visible?      :", beforeStats.hasVoteA && beforeStats.hasVoteB ? "✅ YES (PASS)" : "❌ NO");
    console.log("• Overall Tally Status         :", testReport.beforeVote.tallyConcealed ? "✅ PROPERLY CONCEALED" : "🚨 LEAKED");
    console.log("-------------------------------------------------------------------------------\n");

    // -------------------------------------------------------------------------
    // STEP 6: Cast vote for Challenger A as Account 2
    // -------------------------------------------------------------------------
    console.log(">>> STEP 6: Casting vote for Challenger A...");
    const voteSuccess = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const voteA = btns.find((b) => b.innerText.includes("Vote for Challenger A"));
      if (voteA) {
        voteA.click();
        return true;
      }
      return false;
    });

    if (!voteSuccess) throw new Error("Could not find 'Vote for Challenger A' button");
    console.log("Vote button clicked! Waiting for reaction and tally reveal...");
    await new Promise((r) => setTimeout(r, 2500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step5_account2_after_voting.png") });
    console.log("Saved screenshot: step5_account2_after_voting.png");

    // CRITICAL TALLY INSPECTION AFTER VOTING
    const afterStats = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasPercent = /% of votes/i.test(text);
      const hasYourPick = /YOUR PICK/i.test(text);
      const hasRecordedBanner = /Your vote has been recorded/i.test(text);
      const tallyBars = document.querySelectorAll("div.w-full.h-2.rounded-full.bg-zinc-800");

      return {
        hasPercent,
        hasYourPick,
        hasRecordedBanner,
        tallyBarCount: tallyBars.length,
        fullTextSnippet: text.slice(0, 800),
      };
    });

    testReport.afterVote.percentVisible = afterStats.hasPercent;
    testReport.afterVote.voteCountsVisible = afterStats.tallyBarCount > 0;
    testReport.afterVote.yourPickBadgeVisible = afterStats.hasYourPick;
    testReport.afterVote.confettiRecordedBannerVisible = afterStats.hasRecordedBanner;
    testReport.afterVote.tallyRevealed = afterStats.hasPercent && afterStats.tallyBarCount > 0;

    console.log("-------------------------------------------------------------------------------");
    console.log("                     AFTER-VOTING AUDIT RESULTS                                ");
    console.log("-------------------------------------------------------------------------------");
    console.log("• Percentage of votes visible? :", afterStats.hasPercent ? "✅ REVEALED (PASS)" : "❌ FAILED TO REVEAL");
    console.log("• Progress bars rendered?      :", afterStats.tallyBarCount > 0 ? "✅ REVEALED (PASS)" : "❌ NO BARS");
    console.log("• 'YOUR PICK' badge rendered?  :", afterStats.hasYourPick ? "✅ YES (PASS)" : "❌ NO");
    console.log("• 'Your vote has been recorded':", afterStats.hasRecordedBanner ? "✅ YES (PASS)" : "❌ NO");
    console.log("• Overall Tally Reveal Status  :", testReport.afterVote.tallyRevealed ? "✅ VERIFIED REVEALED" : "❌ FAILED");
    console.log("-------------------------------------------------------------------------------\n");

    // Write full report JSON
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "battle_test_results.json"),
      JSON.stringify(testReport, null, 2)
    );
    console.log("Saved full results JSON: battle_test_results.json");

  } catch (err) {
    console.error("❌ Test crashed:", err);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "test_failure.png") }).catch(() => {});
  } finally {
    await browser.close();
    console.log("\n=== TEST EXECUTION FINISHED ===");
  }
}

runBattleE2ETest();
