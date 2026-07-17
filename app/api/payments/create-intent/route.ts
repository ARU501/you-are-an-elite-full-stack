import { NextResponse } from "next/server";

import {
  DEFAULT_LATE_FEE_CENTS,
  LATE_FEE_GRACE_DAYS,
  createReceiptNumber,
  createStripeIntentReference,
} from "@/lib/payment-processing";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { RentPaymentRow } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";
import { createStripePaymentIntent, hasStripeSecretKey, mapStripeIntentStatus } from "@/lib/stripe";
import { PaymentIntentRequestBody, PaymentIntentResponse, PaymentMethodType } from "@/lib/types";

function isPaymentMethod(value: unknown): value is PaymentMethodType {
  return value === "ach" || value === "card";
}

function buildError(message: string, status = 400) {
  return NextResponse.json<PaymentIntentResponse>(
    {
      ok: false,
      mode: hasStripeSecretKey() ? "stripe" : "demo",
      paymentIntentId: createStripeIntentReference(),
      status: "failed",
      amountCents: 0,
      method: "ach",
      autopay: false,
      message,
      error: message,
    },
    { status },
  );
}

// Authoritative total: stored base + stored late fee, or the default late
// fee once the due date is past the grace window (mirrors the client).
function computeTotalDueCents(payment: RentPaymentRow, now = new Date()) {
  if (payment.late_fee_cents > 0) {
    return payment.base_amount_cents + payment.late_fee_cents;
  }

  const deadline = new Date(payment.due_date);
  deadline.setDate(deadline.getDate() + LATE_FEE_GRACE_DAYS);
  deadline.setHours(23, 59, 59, 999);

  return now.getTime() > deadline.getTime()
    ? payment.base_amount_cents + DEFAULT_LATE_FEE_CENTS
    : payment.base_amount_cents;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return buildError("Supabase is not configured on the server.", 503);
  }

  let payload: Partial<PaymentIntentRequestBody> | null = null;

  try {
    payload = (await request.json()) as Partial<PaymentIntentRequestBody>;
  } catch {
    return buildError("Request body must be valid JSON.");
  }

  if (!payload?.paymentId || !payload.tenantId) {
    return buildError("paymentId and tenantId are required.");
  }

  if (!isPaymentMethod(payload.method)) {
    return buildError("method must be either 'ach' or 'card'.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildError("You must be signed in to start a payment.", 401);
  }

  // RLS scopes this select: a tenant can only load payments on their own
  // tenancy, so a foreign paymentId comes back empty.
  const { data: paymentData, error: paymentError } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("id", payload.paymentId)
    .maybeSingle();

  const payment = paymentData as RentPaymentRow | null;
  if (paymentError || !payment) {
    return buildError("Payment record not found for your account.", 404);
  }

  if (payment.tenancy_id !== payload.tenantId) {
    return buildError("Payment does not belong to that tenancy.", 403);
  }

  if (payment.status === "paid") {
    return buildError("That payment is already settled.", 409);
  }

  const amountCents = computeTotalDueCents(payment);
  const input: PaymentIntentRequestBody = {
    paymentId: payment.id,
    tenantId: payment.tenancy_id,
    amountCents,
    method: payload.method,
    autopay: Boolean(payload.autopay),
  };

  if (hasStripeSecretKey()) {
    try {
      const intent = await createStripePaymentIntent(input);
      if (!intent) {
        throw new Error("Stripe client was unavailable.");
      }

      const intentStatus = mapStripeIntentStatus(intent.status);

      await supabase
        .from("rent_payments")
        .update({
          status: "pending",
          payment_method: input.method,
          stripe_payment_intent_id: intent.id,
        })
        .eq("id", payment.id);

      await supabase.from("payment_events").insert({
        landlord_id: payment.landlord_id,
        rent_payment_id: payment.id,
        event_type: "payment_intent.created",
        payload: {
          paymentIntentId: intent.id,
          amountCents: input.amountCents,
          method: input.method,
          autopay: input.autopay,
        },
      });

      return NextResponse.json<PaymentIntentResponse>({
        ok: true,
        mode: "stripe",
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        status: intentStatus === "paid" ? "paid" : "pending",
        amountCents: input.amountCents,
        method: input.method,
        autopay: input.autopay,
        message: "Stripe payment intent created. Complete the secure payment step to finish.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe payment intent creation failed.";
      return NextResponse.json<PaymentIntentResponse>(
        {
          ok: false,
          mode: "stripe",
          paymentIntentId: createStripeIntentReference(),
          status: "failed",
          amountCents: input.amountCents,
          method: input.method,
          autopay: input.autopay,
          message,
          error: message,
        },
        { status: 502 },
      );
    }
  }

  // No Stripe keys: manual collection mode. The signed-in tenant records
  // the payment (Zelle, check, cash) and the landlord sees it instantly.
  return NextResponse.json<PaymentIntentResponse>({
    ok: true,
    mode: "demo",
    paymentIntentId: createStripeIntentReference(),
    status: "paid",
    amountCents: input.amountCents,
    method: input.method,
    autopay: input.autopay,
    receiptNumber: createReceiptNumber(),
    message: "Payment recorded manually. Add Stripe keys to collect cards and ACH automatically.",
  });
}
