import { NextResponse } from "next/server";

import { createReceiptNumber, createStripeIntentReference } from "@/lib/payment-processing";
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

export async function POST(request: Request) {
  let payload: Partial<PaymentIntentRequestBody> | null = null;

  try {
    payload = (await request.json()) as Partial<PaymentIntentRequestBody>;
  } catch {
    return buildError("Request body must be valid JSON.");
  }

  if (!payload?.paymentId || !payload.tenantId || !Number.isInteger(payload.amountCents) || payload.amountCents! <= 0) {
    return buildError("paymentId, tenantId, and a positive integer amountCents are required.");
  }

  if (!isPaymentMethod(payload.method)) {
    return buildError("method must be either 'ach' or 'card'.");
  }

  const amountCents = payload.amountCents;
  if (typeof amountCents !== "number") {
    return buildError("amountCents must be a number.");
  }

  const input: PaymentIntentRequestBody = {
    paymentId: payload.paymentId,
    tenantId: payload.tenantId,
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

      return NextResponse.json<PaymentIntentResponse>({
        ok: true,
        mode: "stripe",
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        status: mapStripeIntentStatus(intent.status),
        amountCents: input.amountCents,
        method: input.method,
        autopay: input.autopay,
        message:
          mapStripeIntentStatus(intent.status) === "pending"
            ? "Stripe payment intent created. Finish collection in your hosted or Elements flow."
            : "Stripe accepted the payment intent request.",
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

  return NextResponse.json<PaymentIntentResponse>({
    ok: true,
    mode: "demo",
    paymentIntentId: createStripeIntentReference(),
    status: "paid",
    amountCents: input.amountCents,
    method: input.method,
    autopay: input.autopay,
    receiptNumber: createReceiptNumber(),
    message: "Demo payment completed locally. Add Stripe keys to switch the route into live intent mode.",
  });
}
