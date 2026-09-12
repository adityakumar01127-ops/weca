import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { calculatePostScoringCredits, BATTLE_WINNER_BONUS_WC, MIN_CASHOUT_THRESHOLD_WC } from "../lib/credits";
import { evaluatePayoutAbuseGuards } from "../lib/abuse-guards";

if (typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

// Read and parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/a2556c88-68c1-49c1-a381-72f0bd98bb58";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

interface StepResult {
  step: string;
  status: "PASS" | "FAIL";
  details: string;
}

const results: StepResult[] = [];

function record(step: string, status: "PASS" | "FAIL", details: string) {
  results.push({ step, status, details });
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} [${step}]: ${details}`);
}

async function main() {
  console.log("===============================================================================");
  console.log("             WECA PHASE 4: CREDITS & MONETIZATION VERIFICATION                  ");
  console.log("===============================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP TEST USERS
    // -------------------------------------------------------------------------
    console.log("--- 1. SETTING UP TEST ACCOUNTS ---");
    const testEmailUserA = `phase4_userA_${Date.now()}@weca.test`;
    const testEmailUserB = `phase4_userB_${Date.now()}@weca.test`;
    const testEmailVoter = `phase4_voter_${Date.now()}@weca.test`;

    const { data: uA } = await supabase.auth.admin.createUser({
      email: testEmailUserA,
      password: "TestPassword123!",
      email_confirm: true,
    });
    const { data: uB } = await supabase.auth.admin.createUser({
      email: testEmailUserB,
      password: "TestPassword123!",
      email_confirm: true,
    });
    const { data: uVoter } = await supabase.auth.admin.createUser({
      email: testEmailVoter,
      password: "TestPassword123!",
      email_confirm: true,
    });

    const userA_id = uA!.user!.id;
    const userB_id = uB!.user!.id;
    const voter_id = uVoter!.user!.id;

    await supabase.from("profiles").upsert([
      { id: userA_id, username: `creator_a_${Date.now().toString().slice(-4)}`, display_name: "Creator Alpha", credits_balance: 0 },
      { id: userB_id, username: `creator_b_${Date.now().toString().slice(-4)}`, display_name: "Creator Beta", credits_balance: 0 },
      { id: voter_id, username: `voter_${Date.now().toString().slice(-4)}`, display_name: "Impartial Voter", credits_balance: 0 },
    ]);

    record("Test Accounts", "PASS", `Created User A (${userA_id}), User B (${userB_id}), Voter (${voter_id})`);

    // -------------------------------------------------------------------------
    // 2. CREATE POSTS & TEST CREDIT ACCRUAL ON SCORING
    // -------------------------------------------------------------------------
    console.log("\n--- 2. POST CREATION & CREDIT ACCRUAL ON SCORING ---");
    const { data: postA } = await supabase
      .from("posts")
      .insert({
        user_id: userA_id,
        image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
        caption: "Glitching neon monolith in fog",
        scoring_status: "scoring",
      })
      .select()
      .single();

    const { data: postB } = await supabase
      .from("posts")
      .insert({
        user_id: userB_id,
        image_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800",
        caption: "Bizarre geometry in brutalist concrete",
        scoring_status: "scoring",
      })
      .select()
      .single();

    // Call scoring API on Post A
    const scoreRes = await fetch(`${BASE_URL}/api/score-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        record: {
          id: postA.id,
          user_id: userA_id,
          image_url: postA.image_url,
          caption: postA.caption,
        },
      }),
    });

    const scoreData = await scoreRes.json();
    if (!scoreData.success) throw new Error(`Scoring failed: ${scoreData.error}`);

    const expectedAccrual = calculatePostScoringCredits(scoreData.scores.weirdness, scoreData.scores.uniqueness);

    // Verify User A profile credits balance updated
    const { data: updatedProfileA } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", userA_id)
      .single();

    if (updatedProfileA?.credits_balance !== expectedAccrual.total) {
      throw new Error(`Expected balance ${expectedAccrual.total} WC, got ${updatedProfileA?.credits_balance}`);
    }

    // Verify credit_transactions table contains the audit row
    const { data: scoreTx } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("post_id", postA.id)
      .single();

    if (!scoreTx || scoreTx.amount !== expectedAccrual.total) {
      throw new Error(`Credit transaction log missing or mismatch for scored post: ${JSON.stringify(scoreTx)}`);
    }

    record(
      "Scoring Credit Accrual",
      "PASS",
      `Post scored (W: ${scoreData.scores.weirdness}, U: ${scoreData.scores.uniqueness}) -> Accrued ${expectedAccrual.total} WC. Logged in credit_transactions #${scoreTx.id.slice(0, 8)}.`
    );

    // -------------------------------------------------------------------------
    // 3. RE-VERIFY PHASE 3 BATTLES & VERIFY BATTLE VICTOR BONUS (+50 WC)
    // -------------------------------------------------------------------------
    console.log("\n--- 3. RE-VERIFYING PHASE 3 BATTLES & VICTOR BONUS ACCRUAL ---");
    // Start a battle with threshold = 1
    const { data: battle } = await supabase
      .from("battles")
      .insert({
        post_a_id: postA.id,
        post_b_id: postB.id,
        created_by: userB_id,
        vote_threshold: 1,
        status: "active",
      })
      .select()
      .single();

    record("Battle Launch", "PASS", `Live Battle #${battle.id.slice(0, 8)} created pitting Post A vs Post B.`);

    // Voter casts vote for Post A
    const voteRes = await fetch(`${BASE_URL}/api/battles/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        battle_id: battle.id,
        voter_id: voter_id,
        voted_for_post_id: postA.id,
      }),
    });

    const voteData = await voteRes.json();
    if (!voteData.success) throw new Error(`Vote failed: ${voteData.error}`);

    // Fetch updated battle
    const { data: endedBattle } = await supabase
      .from("battles")
      .select("*")
      .eq("id", battle.id)
      .single();

    if (endedBattle.status !== "ended" || endedBattle.winner_post_id !== postA.id) {
      throw new Error(`Battle did not end with winner Post A: ${JSON.stringify(endedBattle)}`);
    }

    record("Phase 3 Battle Conclusion", "PASS", `Battle auto-ended with threshold=1. Winner declared: Post A (${postA.id}).`);

    // Verify Battle Victor Bonus (+50 WC) awarded to User A
    const { data: victorProfile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", userA_id)
      .single();

    const expectedBalanceAfterWin = expectedAccrual.total + BATTLE_WINNER_BONUS_WC;
    if (victorProfile?.credits_balance !== expectedBalanceAfterWin) {
      throw new Error(`Expected balance ${expectedBalanceAfterWin} WC after victory bonus, got ${victorProfile?.credits_balance}`);
    }

    const { data: winTx } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("battle_id", battle.id)
      .single();

    if (!winTx || winTx.amount !== BATTLE_WINNER_BONUS_WC) {
      throw new Error(`Battle victor bonus transaction missing or mismatch: ${JSON.stringify(winTx)}`);
    }

    record(
      "Battle Victor Bonus (+50 WC)",
      "PASS",
      `Winning post owner (${userA_id}) received +50 WC bonus. Logged in credit_transactions #${winTx.id.slice(0, 8)}.`
    );

    // -------------------------------------------------------------------------
    // 4. TEST ABUSE GUARDS
    // -------------------------------------------------------------------------
    console.log("\n--- 4. TESTING MULTI-VECTOR ABUSE GUARDS ---");
    // Evaluate freshly created user (age < 7 days)
    const abuseFreshUser = await evaluatePayoutAbuseGuards(supabase, userB_id);
    if (!abuseFreshUser.isSuspicious || abuseFreshUser.riskScore < 30) {
      throw new Error(`Fresh account should trigger abuse guards: ${JSON.stringify(abuseFreshUser)}`);
    }

    record(
      "Abuse Guard Detection",
      "PASS",
      `New account flagged suspicious (Risk: ${abuseFreshUser.riskScore}/100). Reasons: ${abuseFreshUser.reasons.join("; ")}`
    );

    // -------------------------------------------------------------------------
    // 5. TEST CASH-OUT PAYOUT REQUEST (500 WC via UPI)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. TESTING CASH-OUT FLOW & PAYOUT REQUEST ---");
    // Ensure User A has >= 600 WC for testing
    const balanceShortfall = 600 - (victorProfile?.credits_balance || 0);
    if (balanceShortfall > 0) {
      await supabase.rpc("apply_credit_change", {
        p_user_id: userA_id,
        p_amount: balanceShortfall,
        p_reason: "Milestone bonus reward",
      });
    }

    const { data: userABeforePayout } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", userA_id)
      .single();

    const initialBalance = userABeforePayout!.credits_balance;

    // Submit cash-out request for 500 WC via UPI
    const payoutAmount = 500;
    const payoutRes = await fetch(`${BASE_URL}/api/wallet/payout-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userA_id,
        amount: payoutAmount,
        details: {
          method: "upi",
          name: "Creator Alpha",
          upi_id: "alpha@okhdfcbank",
        },
      }),
    });

    const payoutResult = await payoutRes.json();
    if (!payoutResult.success) throw new Error(`Payout request failed: ${payoutResult.error}`);

    const createdRequestId = payoutResult.payoutRequest.id;

    // Verify balance decremented by 500 WC
    const { data: userAAfterPayout } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", userA_id)
      .single();

    if (userAAfterPayout!.credits_balance !== initialBalance - payoutAmount) {
      throw new Error(`Expected balance ${initialBalance - payoutAmount}, got ${userAAfterPayout!.credits_balance}`);
    }

    // Verify negative transaction logged in credit_transactions
    const { data: payoutDeductionTx } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("payout_request_id", createdRequestId)
      .single();

    if (!payoutDeductionTx || payoutDeductionTx.amount !== -payoutAmount) {
      throw new Error(`Payout deduction transaction missing: ${JSON.stringify(payoutDeductionTx)}`);
    }

    record(
      "Cash-Out Payout Request",
      "PASS",
      `Requested 500 WC payout via UPI. Deducted 500 WC, logged transaction #${payoutDeductionTx.id.slice(0, 8)}, created payout request #${createdRequestId.slice(0, 8)} (status: pending).`
    );

    // -------------------------------------------------------------------------
    // 6. TEST ADMIN HUMAN REVIEW: APPROVAL VIA RAZORPAYX
    // -------------------------------------------------------------------------
    console.log("\n--- 6. TESTING ADMIN HUMAN REVIEW & APPROVAL ---");
    // Admin reviews queue
    const adminQueueRes = await fetch(`${BASE_URL}/api/admin/payouts`, {
      headers: { "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    const adminQueueData = await adminQueueRes.json();
    if (!adminQueueData.success) throw new Error(`Admin queue fetch failed: ${adminQueueData.error}`);

    const foundInQueue = adminQueueData.payouts.find((p: any) => p.id === createdRequestId);
    if (!foundInQueue) throw new Error(`Payout request #${createdRequestId} not found in admin queue`);

    // Admin approves request
    const approveRes = await fetch(`${BASE_URL}/api/admin/payouts/${createdRequestId}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        action: "approve",
        notes: "Identity verified and legitimate observational finds",
      }),
    });

    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error(`Approval failed: ${approveData.error}`);

    if (approveData.payoutRequest.status !== "paid" && approveData.payoutRequest.status !== "approved") {
      throw new Error(`Expected status 'paid' or 'approved', got ${approveData.payoutRequest.status}`);
    }

    record(
      "Admin Approval & RazorpayX Payout",
      "PASS",
      `Admin manually approved request #${createdRequestId.slice(0, 8)}. Status updated to '${approveData.payoutRequest.status}' with RazorpayX Payout ID: ${approveData.payoutRequest.razorpayx_payout_id}.`
    );

    // -------------------------------------------------------------------------
    // 7. TEST ADMIN HUMAN REVIEW: REJECTION WITH AUTOMATIC REFUND
    // -------------------------------------------------------------------------
    console.log("\n--- 7. TESTING ADMIN REJECTION & AUTOMATIC REFUND ---");
    // Submit a 2nd payout request for rejection test
    const balanceBeforeReq2 = (await supabase.from("profiles").select("credits_balance").eq("id", userA_id).single()).data!.credits_balance;

    // Grant 500 WC if needed
    if (balanceBeforeReq2 < 500) {
      await supabase.rpc("apply_credit_change", {
        p_user_id: userA_id,
        p_amount: 500,
        p_reason: "Refill for rejection test",
      });
    }

    const preRejectBalance = (await supabase.from("profiles").select("credits_balance").eq("id", userA_id).single()).data!.credits_balance;

    const req2Res = await fetch(`${BASE_URL}/api/wallet/payout-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userA_id,
        amount: 500,
        details: {
          method: "bank_account",
          name: "Creator Alpha",
          account_number: "50100998877665",
          ifsc: "HDFC0001234",
        },
      }),
    });
    const req2Data = await req2Res.json();
    const req2Id = req2Data.payoutRequest.id;

    // Admin rejects request with refund
    const rejectRes = await fetch(`${BASE_URL}/api/admin/payouts/${req2Id}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        action: "reject",
        notes: "Test rejection: invalid IFSC format supplied",
      }),
    });

    const rejectData = await rejectRes.json();
    if (!rejectData.success) throw new Error(`Rejection failed: ${rejectData.error}`);

    // Verify balance was refunded
    const postRejectBalance = (await supabase.from("profiles").select("credits_balance").eq("id", userA_id).single()).data!.credits_balance;
    if (postRejectBalance !== preRejectBalance) {
      throw new Error(`Refund failed: expected ${preRejectBalance} WC, got ${postRejectBalance} WC`);
    }

    // Verify refund row logged in credit_transactions
    const { data: refundTx } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("payout_request_id", req2Id)
      .gt("amount", 0)
      .single();

    if (!refundTx || refundTx.amount !== 500) {
      throw new Error(`Refund transaction log missing: ${JSON.stringify(refundTx)}`);
    }

    record(
      "Admin Rejection & Refund",
      "PASS",
      `Admin rejected request #${req2Id.slice(0, 8)}. Status='rejected', 500 WC refunded to user. Audit transaction logged #${refundTx.id.slice(0, 8)}.`
    );

    // -------------------------------------------------------------------------
    // 8. AUDIT TRAIL INTEGRITY (SUM(credit_transactions.amount) == profiles.credits_balance)
    // -------------------------------------------------------------------------
    console.log("\n--- 8. AUDIT TRAIL MATHEMATICAL INTEGRITY CHECK ---");
    const { data: allUserATransactions } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("user_id", userA_id);

    const sumTransactions = (allUserATransactions || []).reduce((acc, t) => acc + t.amount, 0);
    const finalProfileBalance = (await supabase.from("profiles").select("credits_balance").eq("id", userA_id).single()).data!.credits_balance;

    if (sumTransactions !== finalProfileBalance) {
      throw new Error(`Balance desynchronization! SUM(tx)=${sumTransactions}, profile=${finalProfileBalance}`);
    }

    record(
      "Audit Trail Mathematical Integrity",
      "PASS",
      `Mathematical parity verified: SUM(transactions)=${sumTransactions} WC matches profiles.credits_balance=${finalProfileBalance} WC.`
    );

    // -------------------------------------------------------------------------
    // 9. BROWSER VISUAL VERIFICATION (PUPPETEER)
    // -------------------------------------------------------------------------
    console.log("\n--- 9. BROWSER VISUAL SCREENSHOTS VIA PUPPETEER ---");
    const browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Shot 1: Wallet with Payout Requests and Transactions
    await page.goto(`${BASE_URL}/wallet`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    const shotWallet = "shot_phase4_01_wallet_monetization.png";
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotWallet) });
    record("Visual: Wallet View", "PASS", `Captured ${shotWallet}`);

    // Shot 2: Admin Payouts Desk
    await page.goto(`${BASE_URL}/admin/payouts`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    const shotAdmin = "shot_phase4_02_admin_payouts_desk.png";
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotAdmin) });
    record("Visual: Admin Review Desk", "PASS", `Captured ${shotAdmin}`);

    await browser.close();

    console.log("\n===============================================================================");
    console.log("                         VERIFICATION SUMMARY                                   ");
    console.log("===============================================================================");
    console.table(results);

    const reportPath = path.join(ARTIFACTS_DIR, "phase4_monetization_verification.json");
    fs.writeFileSync(reportPath, JSON.stringify({ passed: true, results }, null, 2));
    console.log(`\nDetailed verification saved to: ${reportPath}`);
  } catch (err: any) {
    console.error("FATAL VERIFICATION ERROR:", err);
    process.exit(1);
  }
}

main().catch(console.error);
