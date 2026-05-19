import { NextResponse } from "next/server";

import { verifyStripeWebhookSignature, StripeWebhookEvent } from "@/lib/stripe";

function resolveEventMessage(eventType: string) {
  if (eventType === "payment_intent.succeeded") {
    return "Mark the rent payment paid and send a receipt notification.";
  }

  if (eventType === "payment_intent.processing") {
    return "Keep the rent payment in pending status until the processor settles it.";
  }

  if (eventType === "payment_intent.payment_failed") {
    return "Mark the rent payment failed and notify the tenant to retry or switch methods.";
  }

  if (eventType === "charge.refunded" || eventType === "payment_intent.canceled") {
    return "Re-open the payment record and reconcile the refund or cancellation.";
  }

  return "Store the webhook event idempotently and ignore unsupported event types safely.";
}

export async function POST(request: Request) {
  const payload = await request.text();
  if (!payload) {
    return NextResponse.json({ ok: false, message: "Webhook payload was empty." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret) {
    if (!signature) {
      return NextResponse.json({ ok: false, message: "Missing stripe-signature header." }, { status: 400 });
    }

    if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
      return NextResponse.json({ ok: false, message: "Stripe webhook signature verification failed." }, { status: 400 });
    }
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, message: "Webhook payload must be valid JSON." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    verified: Boolean(webhookSecret),
    eventId: event.id,
    eventType: event.type,
    nextAction: resolveEventMessage(event.type),
    paymentIntentId:
      typeof event.data?.object?.id === "string"
        ? event.data.object.id
        : typeof event.data?.object?.payment_intent === "string"
          ? event.data.object.payment_intent
          : null,
    note: "In production, write the event to payment_events, match it to rent_payments, and make the mutation idempotent by stripe_event_id.",
  });
}
