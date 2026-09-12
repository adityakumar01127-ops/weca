import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

// Read env
const envContent = fs.readFileSync(path.resolve(".env.local"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const t = line.trim();
  if (!t || t.startsWith("#")) return;
  const idx = t.indexOf("=");
  if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
});

const WEBHOOK_SECRET = env.RAZORPAYX_WEBHOOK_SECRET || "whsec_test_razorpayx_secret_key_8921";
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runSecurityTests() {
  console.log("===============================================================================");
  console.log("       RAZORPAYX WEBHOOK SECURITY: SIGNATURE & DEDUPLICATION AUDIT             ");
  console.log("===============================================================================\n");
  console.log(`Configured Secret: ${WEBHOOK_SECRET.slice(0, 10)}...`);

  // 1. Create a dummy test payout row in Supabase so webhook has a target
  const { data: testPayout, error: pErr } = await supabase
    .from("payout_requests")
    .insert({
      user_id: "553d8a87-eddc-470a-be43-ae578aa18d4d", // voter_three
      amount: 25,
      currency: "INR",
      status: "approved",
      payout_details: { method: "upi", upi_id: "sec_test@upi", name: "Security Test" },
      razorpayx_payout_id: `pout_sec_${Date.now()}`,
    })
    .select()
    .single();

  if (pErr || !testPayout) {
    throw new Error(`Failed to create test payout: ${pErr?.message}`);
  }
  console.log(`Created test payout request in Supabase: #${testPayout.id}`);

  const eventId = `evt_sec_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const rawPayload = JSON.stringify({
    entity: "event",
    account_id: "acc_sec_audit",
    event: "payout.processed",
    contains: ["payout"],
    payload: {
      payout: {
        entity: {
          id: testPayout.razorpayx_payout_id,
          reference_id: testPayout.id,
          amount: 2000,
          currency: "INR",
          status: "processed",
          utr: "UTR_SECURITY_VERIFIED_7766",
          mode: "UPI",
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  });

  const correctSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawPayload)
    .digest("hex");

  const results = {
    test1_unsigned: null,
    test2_wrong_signature: null,
    test3_valid_signature: null,
    test4_deduplication: null,
    test5_raw_body_tamper: null,
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Unsigned Request (Missing x-razorpay-signature)
    // -------------------------------------------------------------------------
    console.log("\n>>> TEST 1: Sending UNSIGNED request (no signature header)...");
    const res1 = await fetch("http://localhost:3000/api/webhooks/razorpayx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-event-id": eventId,
      },
      body: rawPayload,
    });

    const body1 = await res1.json();
    console.log(`HTTP Status: ${res1.status} (Expected: 400)`);
    console.log("Response Body:", body1);

    results.test1_unsigned = {
      status: res1.status,
      body: body1,
      passed: res1.status === 400 && body1.error?.includes("Missing x-razorpay-signature"),
    };
    if (!results.test1_unsigned.passed) throw new Error("TEST 1 FAILED: Unsigned request was not rejected with 400!");
    console.log("✅ TEST 1 PASSED: Unsigned request rejected with HTTP 400.");

    // -------------------------------------------------------------------------
    // TEST 2: Wrong / Forged Signature
    // -------------------------------------------------------------------------
    console.log("\n>>> TEST 2: Sending FORGED / WRONG signature request...");
    const forgedSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    const res2 = await fetch("http://localhost:3000/api/webhooks/razorpayx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": forgedSignature,
        "x-razorpay-event-id": eventId,
      },
      body: rawPayload,
    });

    const body2 = await res2.json();
    console.log(`HTTP Status: ${res2.status} (Expected: 401)`);
    console.log("Response Body:", body2);

    results.test2_wrong_signature = {
      status: res2.status,
      body: body2,
      passed: res2.status === 401 && body2.error?.includes("Invalid webhook signature"),
    };
    if (!results.test2_wrong_signature.passed) throw new Error("TEST 2 FAILED: Wrong signature was not rejected with 401!");
    console.log("✅ TEST 2 PASSED: Forged signature rejected with HTTP 401.");

    // -------------------------------------------------------------------------
    // TEST 3: Correctly Signed Request
    // -------------------------------------------------------------------------
    console.log("\n>>> TEST 3: Sending CORRECTLY SIGNED request...");
    const res3 = await fetch("http://localhost:3000/api/webhooks/razorpayx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": correctSignature,
        "x-razorpay-event-id": eventId,
      },
      body: rawPayload,
    });

    const body3 = await res3.json();
    console.log(`HTTP Status: ${res3.status} (Expected: 200)`);
    console.log("Response Body:", body3);

    const { data: updatedPayout } = await supabase
      .from("payout_requests")
      .select("status, admin_notes")
      .eq("id", testPayout.id)
      .single();

    results.test3_valid_signature = {
      status: res3.status,
      body: body3,
      payoutStatusInDb: updatedPayout?.status,
      passed: res3.status === 200 && updatedPayout?.status === "paid",
    };
    if (!results.test3_valid_signature.passed) throw new Error("TEST 3 FAILED: Valid signature was not accepted or status was not updated to paid!");
    console.log(`✅ TEST 3 PASSED: Accepted with HTTP 200, status updated to "${updatedPayout?.status}".`);

    // -------------------------------------------------------------------------
    // TEST 4: Deduplication Check (Replaying the exact same event ID)
    // -------------------------------------------------------------------------
    console.log("\n>>> TEST 4: Sending DUPLICATE event replay (same x-razorpay-event-id)...");
    const res4 = await fetch("http://localhost:3000/api/webhooks/razorpayx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": correctSignature,
        "x-razorpay-event-id": eventId, // Identical event ID
      },
      body: rawPayload,
    });

    const body4 = await res4.json();
    console.log(`HTTP Status: ${res4.status} (Expected: 200 with duplicate flag)`);
    console.log("Response Body:", body4);

    results.test4_deduplication = {
      status: res4.status,
      body: body4,
      passed: res4.status === 200 && body4.duplicate === true,
    };
    if (!results.test4_deduplication.passed) throw new Error("TEST 4 FAILED: Duplicate event was not deduplicated!");
    console.log("✅ TEST 4 PASSED: Duplicate event identified and deduplicated.");

    // -------------------------------------------------------------------------
    // TEST 5: Raw Stream vs Parsed Body Check
    // -------------------------------------------------------------------------
    console.log("\n>>> TEST 5: Validating Raw Body Sensitivity (Whitespace / Formatting)...");
    // Adding 1 trailing newline or space to the payload string simulates JSON re-serialization differences
    const tamperedPayload = rawPayload + " ";
    const res5 = await fetch("http://localhost:3000/api/webhooks/razorpayx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": correctSignature, // Signature computed on original raw string
        "x-razorpay-event-id": eventId + "_tamper",
      },
      body: tamperedPayload,
    });

    const body5 = await res5.json();
    console.log(`HTTP Status: ${res5.status} (Expected: 401)`);
    console.log("Response Body:", body5);

    results.test5_raw_body_tamper = {
      status: res5.status,
      body: body5,
      passed: res5.status === 401 && body5.error?.includes("Invalid webhook signature"),
    };
    if (!results.test5_raw_body_tamper.passed) throw new Error("TEST 5 FAILED: Tampered body was not rejected!");
    console.log("✅ TEST 5 PASSED: Raw body verification confirmed (byte-accurate stream check).");

    // -------------------------------------------------------------------------
    // TEST 6: Concurrency Race Condition Test (Promise.all with identical event ID)
    // -------------------------------------------------------------------------
    console.log("\n>>> TEST 6: Firing TWO concurrent requests with identical event_id via Promise.all...");

    // Create another test payout specifically for refund race test
    const { data: testPayout6, error: pErr6 } = await supabase
      .from("payout_requests")
      .insert({
        user_id: "553d8a87-eddc-470a-be43-ae578aa18d4d",
        amount: 50,
        currency: "INR",
        status: "approved",
        payout_details: { method: "upi", upi_id: "sec_race@upi", name: "Concurrency Race Test" },
        razorpayx_payout_id: `pout_race_${Date.now()}`,
      })
      .select()
      .single();

    if (pErr6 || !testPayout6) {
      throw new Error(`Failed to create test payout for Test 6: ${pErr6?.message}`);
    }

    const eventId6 = `evt_race_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const racePayload = JSON.stringify({
      entity: "event",
      account_id: "acc_sec_audit",
      event: "payout.failed",
      contains: ["payout"],
      payload: {
        payout: {
          entity: {
            id: testPayout6.razorpayx_payout_id,
            reference_id: testPayout6.id,
            amount: 5000,
            currency: "INR",
            status: "failed",
            failure_reason: "Simulated Concurrent Race Condition Failure",
            mode: "UPI",
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    });

    const raceSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(racePayload)
      .digest("hex");

    const sendRequest = () =>
      fetch("http://localhost:3000/api/webhooks/razorpayx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": raceSignature,
          "x-razorpay-event-id": eventId6,
        },
        body: racePayload,
      }).then(async (r) => ({
        status: r.status,
        body: await r.json(),
      }));

    // Fire concurrently via Promise.all
    console.log(`Sending simultaneous requests for event ID: ${eventId6}...`);
    const [responseA, responseB] = await Promise.all([sendRequest(), sendRequest()]);

    console.log("Concurrent Response A:", responseA);
    console.log("Concurrent Response B:", responseB);

    const duplicates = [responseA, responseB].filter((r) => r.body?.duplicate === true);
    const processed = [responseA, responseB].filter(
      (r) => r.body?.status === "rejected" || r.body?.status === "paid"
    );

    console.log(`Duplicates caught by PK collision lock: ${duplicates.length} (Expected: 1)`);
    console.log(`Requests processed through settlement/refund: ${processed.length} (Expected: 1)`);

    // Verify database mutations: exactly 1 refund transaction created
    const { data: refundTxs } = await supabase
      .from("credit_transactions")
      .select("id, amount, reason")
      .eq("payout_request_id", testPayout6.id);

    console.log(`Credit transaction refund count in DB: ${refundTxs?.length || 0} (Expected: 1)`);

    // Check processed_webhook_events has exactly 1 row
    const { data: eventRecords } = await supabase
      .from("processed_webhook_events")
      .select("event_id")
      .eq("event_id", eventId6);

    console.log(`Processed webhook events records in DB: ${eventRecords?.length || 0} (Expected: 1)`);

    const passedTest6 =
      duplicates.length === 1 &&
      processed.length === 1 &&
      refundTxs?.length === 1 &&
      eventRecords?.length === 1;

    results.test6_concurrency_race = {
      responseA,
      responseB,
      refundTxCount: refundTxs?.length,
      eventRecordsCount: eventRecords?.length,
      passed: passedTest6,
    };

    if (!passedTest6) {
      throw new Error("TEST 6 FAILED: Race condition allowed duplicate execution or failed PK lock!");
    }
    console.log("✅ TEST 6 PASSED: Concurrency race condition completely prevented via upfront PK insert!");

    console.log("\n===============================================================================");
    console.log("                ALL 6 WEBHOOK SECURITY AUDIT TESTS PASSED!                     ");
    console.log("===============================================================================\n");

    // Clean up Test 6 records
    await supabase.from("credit_transactions").delete().eq("payout_request_id", testPayout6.id);
    await supabase.from("processed_webhook_events").delete().eq("event_id", eventId6);
    await supabase.from("payout_requests").delete().eq("id", testPayout6.id);

  } finally {
    // Clean up test payout
    await supabase.from("processed_webhook_events").delete().eq("event_id", eventId);
    await supabase.from("payout_requests").delete().eq("id", testPayout.id);
    console.log("Cleaned up temporary test payout and webhook event records.");
  }
}

runSecurityTests().catch((err) => {
  console.error("FATAL ERROR in security audit:", err);
  process.exit(1);
});
