import { NextResponse } from "next/server";

import { createReceiptNumber } from "@/lib/payment-processing";
import { createAdminClient } from "@/lib/supabase/admin";
import { RentPaymentRow, TenancyRow } from "@/lib/supabase/mappers";
import { verifyStripeWebhookSignature, StripeWebhookEvent } from "@/lib/stripe";

const HANDLED_EVENTS = new Set([
  "payment_intent.succeeded",
  "payment_intent.processing",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
]);

function extractPaymentIntentId(event: StripeWebhookEvent): string | null {
  const object = event.data?.object ?? {};
  if (typeof object.id === "string" && event.type.startsWith("payment_intent.")) {
    return object.id;
  }
  if (typeof object.payment_intent === "string") {
    return object.payment_intent;
  }
  return null;
}

function extractMetadataPaymentId(event: StripeWebhookEvent): string | null {
  const metadata = (event.data?.object?.metadata ?? {}) as Record<string, unknown>;
  return typeof metadata.payment_id === "string" ? metadata.payment_id : null;
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

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ ok: true, eventType: event.type, handled: false });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY is not configured; cannot settle payments." },
      { status: 503 },
    );
  }

  // Idempotency: stripe_event_id is unique. A duplicate delivery inserts
  // nothing and we acknowledge without re-applying the mutation.
  const { data: eventRows, error: eventInsertError } = await admin
    .from("payment_events")
    .upsert(
      {
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data?.object ?? {},
      },
      { onConflict: "stripe_event_id", ignoreDuplicates: true },
    )
    .select();

  if (eventInsertError) {
    return NextResponse.json({ ok: false, message: eventInsertError.message }, { status: 500 });
  }

  if (!eventRows || eventRows.length === 0) {
    return NextResponse.json({ ok: true, eventId: event.id, duplicate: true });
  }

  const eventRowId = (eventRows[0] as { id: string }).id;
  const paymentIntentId = extractPaymentIntentId(event);
  const metadataPaymentId = extractMetadataPaymentId(event);

  let payment: RentPaymentRow | null = null;
  if (paymentIntentId) {
    const { data } = await admin
      .from("rent_payments")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();
    payment = data as RentPaymentRow | null;
  }
  if (!payment && metadataPaymentId) {
    const { data } = await admin.from("rent_payments").select("*").eq("id", metadataPaymentId).maybeSingle();
    payment = data as RentPaymentRow | null;
  }

  if (!payment) {
    return NextResponse.json({ ok: true, eventId: event.id, matched: false });
  }

  await admin
    .from("payment_events")
    .update({ rent_payment_id: payment.id, landlord_id: payment.landlord_id })
    .eq("id", eventRowId);

  const object = event.data?.object ?? {};
  const amountReceived =
    typeof object.amount_received === "number" && object.amount_received > 0
      ? object.amount_received
      : payment.base_amount_cents + payment.late_fee_cents;

  if (event.type === "payment_intent.succeeded") {
    const receiptNumber = payment.receipt_number ?? createReceiptNumber();
    await admin
      .from("rent_payments")
      .update({
        status: "paid",
        paid_amount_cents: amountReceived,
        receipt_number: receiptNumber,
        paid_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq("id", payment.id);

    const { data: tenancyData } = await admin
      .from("tenancies")
      .select("*")
      .eq("id", payment.tenancy_id)
      .maybeSingle();
    const tenancy = tenancyData as TenancyRow | null;

    if (tenancy?.tenant_profile_id) {
      await admin.from("messages").insert({
        landlord_id: payment.landlord_id,
        tenancy_id: payment.tenancy_id,
        sender_id: tenancy.tenant_profile_id,
        recipient_id: payment.landlord_id,
        content: `Rent payment for ${payment.label} settled via Stripe. Receipt ${receiptNumber}.`,
      });
    }

    await admin.from("activities").insert({
      landlord_id: payment.landlord_id,
      tenancy_id: payment.tenancy_id,
      title: "Rent payment settled",
      detail: `${payment.label} was confirmed by Stripe and marked paid.`,
      type: "payment",
    });
  } else if (event.type === "payment_intent.processing") {
    await admin.from("rent_payments").update({ status: "pending" }).eq("id", payment.id);
  } else if (event.type === "payment_intent.payment_failed") {
    const lastError = object.last_payment_error as { message?: string } | undefined;
    await admin
      .from("rent_payments")
      .update({
        status: "failed",
        failure_reason: lastError?.message ?? "The payment processor declined the attempt.",
      })
      .eq("id", payment.id);
  } else if (event.type === "payment_intent.canceled" || event.type === "charge.refunded") {
    await admin
      .from("rent_payments")
      .update({
        status: "due",
        paid_amount_cents: null,
        paid_at: null,
        failure_reason: null,
      })
      .eq("id", payment.id);
  }

  return NextResponse.json({
    ok: true,
    verified: Boolean(webhookSecret),
    eventId: event.id,
    eventType: event.type,
    paymentId: payment.id,
  });
}
