import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/12e40bd2-ee48-4afc-82ce-c8def1a5bbdb";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BATTLE_ID = "325a402a-76be-43be-bffe-875a8e469407";
const BATTLE_URL = `http://localhost:3000/versus/${BATTLE_ID}`;

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

async function runBattleEndTest() {
  console.log("===============================================================================");
  console.log("             WECA BATTLE AUTO-END & LOCK AUDIT: LOWERED THRESHOLD               ");
  console.log("===============================================================================\n");

  // Step 1: Temporarily lower vote_threshold to 2 for this test battle
  console.log(`>>> STEP 1: Setting vote_threshold = 2 on battle ${BATTLE_ID}...`);
  const { data: updatedBattle, error: upErr } = await admin
    .from("battles")
    .update({ vote_threshold: 2, status: "active", winner_post_id: null, ended_at: null })
    .eq("id", BATTLE_ID)
    .select()
    .single();

  if (upErr) throw new Error("Failed to update battle threshold: " + upErr.message);
  console.log(`✅ Battle updated: vote_threshold = ${updatedBattle.vote_threshold}, status = ${updatedBattle.status}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,960"],
    defaultViewport: { width: 1280, height: 960 },
  });

  const page = await browser.newPage();

  const auditReport = {
    battleId: BATTLE_ID,
    initialVoteCount: 1,
    threshold: 2,
    secondVoteAccount: "account3@weca.test",
    postEndChecks: {
      statusIsEnded: false,
      winnerAnnounced: false,
      winnerPostId: null,
      winnerTitle: null,
      votingLockedBanner: false,
      actionButtonsGone: false,
      concludedBattlesTabShowsBattle: false,
      furtherVotesRejectedByAPI: false,
    },
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 2: Log in with Account 3 (to cast the threshold-hitting 2nd vote)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 2: Logging in as Account 3 (account3@weca.test)...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    await page.waitForSelector("input[type='email'], input[placeholder*='you@example.com']");
    await page.type("input[type='email'], input[placeholder*='you@example.com']", "account3@weca.test");
    await page.type("input[type='password']", "Password123!");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2000));
    console.log("✅ Account 3 logged in.");

    // -------------------------------------------------------------------------
    // STEP 3: Navigate to battle page before 2nd vote (1/2 votes)
    // -------------------------------------------------------------------------
    console.log(`\n>>> STEP 3: Navigating to battle page: ${BATTLE_URL}`);
    await page.goto(BATTLE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    const preState = await page.evaluate(() => {
      return {
        text: document.body.innerText,
        hasVoteA: Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Vote for Challenger A")),
      };
    });
    console.log("Active Showdown check before vote 2. Vote for Challenger A button available?", preState.hasVoteA ? "✅ YES" : "❌ NO");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_threshold_before_ending.png") });
    console.log("Saved screenshot: step_threshold_before_ending.png");

    // -------------------------------------------------------------------------
    // STEP 4: Cast 2nd vote (hitting threshold 2/2)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 4: Casting 2nd vote for Challenger A as Account 3...");
    const voteBtnClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btnA = btns.find((b) => b.innerText.includes("Vote for Challenger A"));
      if (btnA) {
        btnA.click();
        return true;
      }
      return false;
    });

    if (!voteBtnClicked) throw new Error("Could not find 'Vote for Challenger A' button");
    console.log("Clicked! Waiting for battle to auto-conclude and update...");
    await new Promise((r) => setTimeout(r, 3000));

    // Reload page to verify persistent ended state
    await page.goto(BATTLE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_threshold_battle_ended.png") });
    console.log("Saved screenshot: step_threshold_battle_ended.png");

    // -------------------------------------------------------------------------
    // STEP 5: Audit Battle Ended State & Final Result
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 5: Auditing Ended Battle UI & Locked State...");
    const endedAudit = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasBattleEndedBadge = text.includes("Battle Ended");
      const hasBattleConcluded = text.includes("Battle Concluded");
      const hasWinnerChallengerA = /Winner: Challenger A/i.test(text);
      const hasVotingLocked = /Voting Locked/i.test(text);
      const hasWinnerBadge = Array.from(document.querySelectorAll("span")).some((s) => s.innerText.includes("WINNER"));
      const voteButtons = Array.from(document.querySelectorAll("button")).filter((b) => b.innerText.includes("Vote for Challenger"));

      return {
        hasBattleEndedBadge,
        hasBattleConcluded,
        hasWinnerChallengerA,
        hasVotingLocked,
        hasWinnerBadge,
        voteButtonCount: voteButtons.length,
        textSnippet: text.slice(0, 1000),
      };
    });

    // Check DB record
    const { data: dbBattle } = await admin.from("battles").select("*").eq("id", BATTLE_ID).single();
    auditReport.postEndChecks.statusIsEnded = dbBattle.status === "ended" && endedAudit.hasBattleEndedBadge;
    auditReport.postEndChecks.winnerAnnounced = endedAudit.hasBattleConcluded && endedAudit.hasWinnerChallengerA;
    auditReport.postEndChecks.winnerPostId = dbBattle.winner_post_id;
    auditReport.postEndChecks.votingLockedBanner = endedAudit.hasVotingLocked;
    auditReport.postEndChecks.actionButtonsGone = endedAudit.voteButtonCount === 0;

    console.log("-------------------------------------------------------------------------------");
    console.log("                   ENDED BATTLE VERIFICATION RESULTS                           ");
    console.log("-------------------------------------------------------------------------------");
    console.log("• Database Status              :", dbBattle.status === "ended" ? "✅ 'ended' (PASS)" : `❌ ${dbBattle.status}`);
    console.log("• Winner Post ID Set in DB     :", dbBattle.winner_post_id ? `✅ ${dbBattle.winner_post_id} (PASS)` : "❌ NULL");
    console.log("• 'Battle Ended' Badge Shown   :", endedAudit.hasBattleEndedBadge ? "✅ YES (PASS)" : "❌ NO");
    console.log("• 'Battle Concluded' Trophy Box:", endedAudit.hasBattleConcluded ? "✅ YES (PASS)" : "❌ NO");
    console.log("• Winner Result Text           :", endedAudit.hasWinnerChallengerA ? "✅ 'Winner: Challenger A' (PASS)" : "❌ NO");
    console.log("• 'WINNER' Trophy Badge on Card:", endedAudit.hasWinnerBadge ? "✅ YES (PASS)" : "❌ NO");
    console.log("• 'Voting Locked' Indicator    :", endedAudit.hasVotingLocked ? "✅ YES (PASS)" : "❌ NO");
    console.log("• Voting Action Buttons Gone   :", endedAudit.voteButtonCount === 0 ? "✅ YES (PASS)" : `❌ ${endedAudit.voteButtonCount} buttons remain`);
    console.log("-------------------------------------------------------------------------------\n");

    // -------------------------------------------------------------------------
    // STEP 6: Verify Concluded Battles Tab on /versus
    // -------------------------------------------------------------------------
    console.log(">>> STEP 6: Checking /versus 'Concluded Battles' tab...");
    await page.goto("http://localhost:3000/versus", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    // Click "Concluded Battles" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const endedTab = btns.find((b) => b.innerText.includes("Concluded Battles"));
      if (endedTab) endedTab.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_versus_concluded_tab.png") });
    console.log("Saved screenshot: step_versus_concluded_tab.png");

    const tabAudit = await page.evaluate((battleId) => {
      const text = document.body.innerText;
      const links = Array.from(document.querySelectorAll("a")).map((a) => a.href);
      const hasBattleLink = links.some((href) => href.includes(battleId));
      const hasEndedTag = text.includes("Ended");
      return { hasBattleLink, hasEndedTag };
    }, BATTLE_ID);

    auditReport.postEndChecks.concludedBattlesTabShowsBattle = tabAudit.hasBattleLink;
    console.log("Concluded Battles tab shows our ended battle?:", tabAudit.hasBattleLink ? "✅ YES (PASS)" : "❌ NO");

    // -------------------------------------------------------------------------
    // STEP 7: Verify Backend Rejects Any Further Vote Attempts on Ended Battle
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 7: Attempting API vote on ended battle (Must be rejected)...");
    const postEndVoteAttempt = await page.evaluate(async (battleId) => {
      const res = await fetch("/api/battles/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle_id: battleId,
          voted_for_post_id: "dcbe34a9-50e2-43c2-8a56-73072be9f74f",
          voter_id: "fa103be3-8533-422c-b368-b7a9c03dba2e", // arbitrary 4th user
        }),
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, data };
    }, BATTLE_ID);

    console.log("Post-end vote attempt response:", postEndVoteAttempt);
    auditReport.postEndChecks.furtherVotesRejectedByAPI = !postEndVoteAttempt.ok && postEndVoteAttempt.data.error.includes("ended");

    console.log("Further vote rejected by API?:", auditReport.postEndChecks.furtherVotesRejectedByAPI ? "✅ YES (LOCKED - PASS)" : "❌ NO");

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "battle_auto_end_audit_results.json"),
      JSON.stringify(auditReport, null, 2)
    );
    console.log("\nSaved full audit results: battle_auto_end_audit_results.json");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
    console.log("=== BATTLE END AUDIT FINISHED ===");
  }
}

runBattleEndTest();
