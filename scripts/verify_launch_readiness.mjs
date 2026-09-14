// scripts/verify_launch_readiness.mjs
// Automated verification suite for Weca Launch Readiness Hardening

import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n🚀 Starting Weca Launch Readiness Verification against ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Admin Payouts Backdoor Elimination
  await test('Admin Payouts rejects unauthenticated request (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/payouts`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Admin Payouts rejects legacy "admin-secret" bypass token (401/403)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/payouts`, {
      headers: { Authorization: 'Bearer admin-secret-backdoor-token' }
    });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Backdoor still accessible! Got status ${res.status}`);
    }
  });

  await test('Admin Action rejects legacy "admin-secret" token (401/403)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/payouts/test-payout-id/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer admin-secret-key-123'
      },
      body: JSON.stringify({ action: 'approve' })
    });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Admin action backdoor still open! Got status ${res.status}`);
    }
  });

  // 2. Financial PII & Wallet Protection
  await test('Wallet Payout Request GET rejects unauthenticated requests (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/wallet/payout-request?userId=spoofed-user-id`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Wallet Payout Request POST rejects unauthenticated requests (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/wallet/payout-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'spoofed-victim-id',
        amount: 500,
        payoutMethod: 'upi',
        details: { upiId: 'attacker@okaxis' }
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Social Anti-Spoofing
  await test('Comments API rejects unauthenticated submission (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 'test-post',
        userId: 'spoofed-user',
        comment: 'Spam comment'
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Like API rejects unauthenticated like action (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 'test-post',
        userId: 'spoofed-user'
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Battle Vote API rejects unauthenticated vote (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/battles/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battleId: 'test-battle',
        voterId: 'spoofed-voter',
        vote: 'challenger'
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 4. Scoring & Payment Verification Hardening
  await test('Score Post API rejects unauthenticated calls (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/score-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 'post-123',
        imageKey: 'img-123'
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Razorpay Verify rejects unauthenticated callers (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'invalid_forged_signature'
      })
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 unauthenticated guard, got ${res.status}`);
    }
  });

  // 5. Razorpay Webhook Security
  await test('Razorpay Webhook rejects requests without signature (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test('Razorpay Webhook rejects spoofed/invalid signature (401/400)', async () => {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000'
      },
      body: JSON.stringify({ event: 'payment.captured' })
    });
    if (res.status !== 401 && res.status !== 400) {
      throw new Error(`Expected 401 or 400, got ${res.status}`);
    }
  });

  // 6. Data Layer & Feed API
  await test('Feed API returns valid response structure from database', async () => {
    const res = await fetch(`${BASE_URL}/api/feed?sort=trending&page=1&limit=5`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.posts)) {
      throw new Error('Expected data.posts array from feed API');
    }
  });

  // 7. Admin UI Route Guard
  await test('Admin layout redirects unauthenticated page request to login', async () => {
    const res = await fetch(`${BASE_URL}/admin/payouts`, { redirect: 'manual' });
    // Next.js redirect responds with 307 or 302 or renders login
    const location = res.headers.get('location') || '';
    if (res.status !== 307 && res.status !== 302 && !location.includes('/login')) {
      // If it rendered directly without redirecting, check if content has redirect or login
      if (res.status === 200) {
        throw new Error('Admin UI rendered without redirect for unauthenticated user!');
      }
    }
  });

  console.log(`\n========================================`);
  console.log(`Verification Summary:`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
