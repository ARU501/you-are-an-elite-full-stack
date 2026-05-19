import { createHmac, timingSafeEqual } from "node:crypto";

import { PaymentIntentRequestBody, PaymentIntentResponse, PaymentMethodType } from "@/lib/types";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

interface StripePaymentIntentPayload {
  id: string;
  client_secret?: string;
  status: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

function resolveStripeMethod(method: PaymentMethodType) {
  return method === "ach" ? "us_bank_account" : "card";
}

export function mapStripeIntentStatus(status: string): PaymentIntentResponse["status"] {
  if (status === "succeeded") {
    return "paid";
  }

  if (status === "processing" || status === "requires_confirmation" || status === "requires_action") {
    return "pending";
  }

  return "failed";
}

export function hasStripeSecretKey() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}

export async function createStripePaymentIntent(input: PaymentIntentRequestBody) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("amount", String(input.amountCents));
  params.set("currency", "usd");
  params.append("payment_method_types[]", resolveStripeMethod(input.method));
  params.set("metadata[payment_id]", input.paymentId);
  params.set("metadata[tenant_id]", input.tenantId);
  params.set("metadata[autopay]", String(input.autopay));

  if (input.autopay) {
    params.set("setup_future_usage", "off_session");
  }

  const response = await fetch(`${STRIPE_API_BASE}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  const payload = (await response.json()) as StripePaymentIntentPayload & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Stripe rejected the payment intent request.");
  }

  return payload;
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string, secret: string) {
  const fragments = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = fragments.find((fragment) => fragment.startsWith("t="))?.slice(2);
  const signatures = fragments
    .filter((fragment) => fragment.startsWith("v1="))
    .map((fragment) => fragment.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    try {
      const signatureBuffer = Buffer.from(signature, "hex");
      return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
      return false;
    }
  });
}
