/**
 * Razorpay Standard Checkout Client
 * Dynamically loads the official Razorpay script and initializes checkout modal.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface CheckoutOptions {
  plan: string;
  onSuccess?: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature?: string;
  }) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayCheckout(options: CheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error("Failed to load Razorpay payment gateway SDK.");
  }

  // 1. Create order on backend
  const res = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan: options.plan }),
  });

  const orderData = await res.json();
  if (!res.ok || !orderData.success) {
    throw new Error(orderData.error || "Unable to initiate payment order.");
  }

  // If Razorpay keys are not yet configured in environment, provide sandbox simulation
  if (orderData.isTestMock && (!orderData.keyId || orderData.keyId.includes("placeholder"))) {
    const proceed = window.confirm(
      `[Razorpay Test Gateway Mode]\n\nPlan: ${orderData.planName}\nAmount: ₹${(orderData.amount / 100).toFixed(2)}\n\nClick OK to simulate successful payment authorization and verify account fulfillment.`
    );
    if (proceed) {
      const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: "mock_signature_test_mode",
          plan: options.plan,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed.");
      }
      if (options.onSuccess) {
        options.onSuccess({
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_order_id: orderData.orderId,
        });
      }
      return;
    } else {
      if (options.onClose) options.onClose();
      return;
    }
  }

  // 2. Configure Razorpay modal options
  const rzpOptions = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency || "INR",
    name: "WICA Platform",
    description: orderData.planName || "WICA Subscription & Credits",
    image: "/weca-emblem.svg",
    order_id: orderData.orderId,
    prefill: {
      email: orderData.userEmail || "",
    },
    theme: {
      color: "#7c3aed", // WICA Violet accent
    },
    modal: {
      ondismiss: () => {
        if (options.onClose) options.onClose();
      },
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature?: string;
    }) => {
      try {
        // 3. Verify signature on backend
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...response,
            plan: options.plan,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || "Payment verification failed.");
        }

        if (options.onSuccess) {
          options.onSuccess(response);
        }
      } catch (err: any) {
        if (options.onError) {
          options.onError(err);
        }
      }
    },
  };

  const razorpayInstance = new window.Razorpay(rzpOptions);
  razorpayInstance.on("payment.failed", (failedRes: any) => {
    if (options.onError) {
      options.onError(new Error(failedRes.error?.description || "Payment failed"));
    }
  });

  razorpayInstance.open();
}
