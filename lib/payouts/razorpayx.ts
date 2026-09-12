import { PayoutDetails, PayoutRequest } from "../types";
import { WC_TO_INR_RATE } from "../credits";

export interface RazorpayXPayoutResult {
  success: boolean;
  payoutId: string;
  status: "processing" | "processed" | "queued" | "simulated";
  mode: "live" | "simulation";
  details?: any;
  error?: string;
}

/**
 * Server-Side RazorpayX Payouts Client.
 * API keys are never exposed to client-side code.
 * 
 * Supports both:
 * 1. Live RazorpayX Payouts API (when RAZORPAYX_KEY_ID & RAZORPAYX_KEY_SECRET are set)
 * 2. High-fidelity Sandbox Simulation (when operating in test or development environments)
 */
export async function initiateRazorpayXPayout(
  payoutRequest: PayoutRequest,
  userEmail?: string
): Promise<RazorpayXPayoutResult> {
  const keyId = process.env.RAZORPAYX_KEY_ID;
  const keySecret = process.env.RAZORPAYX_KEY_SECRET;
  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || "2323230012345678";

  // Calculate amount in Indian Paise (1 INR = 100 paise)
  // E.g., 500 WC * 0.80 = 400 INR = 40,000 paise
  const amountInINR = payoutRequest.amount * WC_TO_INR_RATE;
  const amountInPaise = Math.round(amountInINR * 100);

  // If live credentials are not present, execute sandbox simulation
  if (!keyId || !keySecret) {
    console.log("[RazorpayX Payouts Simulator] Initiating simulated payout:", {
      requestId: payoutRequest.id,
      amountWC: payoutRequest.amount,
      amountInINR,
      amountInPaise,
      payoutDetails: payoutRequest.payout_details,
    });

    const simulatedPayoutId = `pout_sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      success: true,
      payoutId: simulatedPayoutId,
      status: "simulated",
      mode: "simulation",
      details: {
        amount_inr: amountInINR,
        amount_paise: amountInPaise,
        currency: "INR",
        narration: `Weca Creator Cash-Out #${payoutRequest.id.slice(0, 8)}`,
      },
    };
  }

  // Live RazorpayX Payouts Integration
  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    // 1. Create Contact
    const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payoutRequest.payout_details.name,
        email: userEmail || "creator@weca.app",
        type: "creator",
        reference_id: payoutRequest.user_id,
      }),
    });

    if (!contactRes.ok) {
      const err = await contactRes.text();
      throw new Error(`RazorpayX contact creation failed: ${err}`);
    }
    const contactData = await contactRes.json();

    // 2. Create Fund Account (VPA or Bank Account)
    let fundAccountPayload: any = {
      contact_id: contactData.id,
    };

    if (payoutRequest.payout_details.method === "upi" && payoutRequest.payout_details.upi_id) {
      fundAccountPayload.account_type = "vpa";
      fundAccountPayload.vpa = {
        address: payoutRequest.payout_details.upi_id,
      };
    } else {
      fundAccountPayload.account_type = "bank_account";
      fundAccountPayload.bank_account = {
        name: payoutRequest.payout_details.name,
        ifsc: payoutRequest.payout_details.ifsc,
        account_number: payoutRequest.payout_details.account_number,
      };
    }

    const fundRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fundAccountPayload),
    });

    if (!fundRes.ok) {
      const err = await fundRes.text();
      throw new Error(`RazorpayX fund account creation failed: ${err}`);
    }
    const fundData = await fundRes.json();

    // 3. Initiate Payout
    const payoutRes = await fetch("https://api.razorpay.com/v1/payouts", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "X-Payout-Idempotency": `pout_${payoutRequest.id}`,
      },
      body: JSON.stringify({
        account_number: accountNumber,
        fund_account_id: fundData.id,
        amount: amountInPaise,
        currency: "INR",
        mode: payoutRequest.payout_details.method === "upi" ? "UPI" : "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: payoutRequest.id,
        narration: `Weca Payout ${payoutRequest.id.slice(0, 8)}`,
      }),
    });

    if (!payoutRes.ok) {
      const err = await payoutRes.text();
      throw new Error(`RazorpayX payout dispatch failed: ${err}`);
    }

    const payoutData = await payoutRes.json();
    return {
      success: true,
      payoutId: payoutData.id,
      status: payoutData.status || "processing",
      mode: "live",
      details: payoutData,
    };
  } catch (err: any) {
    console.error("Live RazorpayX payout error:", err);
    return {
      success: false,
      payoutId: "",
      status: "queued",
      mode: "live",
      error: err.message || "Failed to process payout via RazorpayX",
    };
  }
}
