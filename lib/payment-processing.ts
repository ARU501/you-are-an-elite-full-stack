import { PaymentItem, PaymentMethodType } from "@/lib/types";

export const LATE_FEE_GRACE_DAYS = 3;
export const DEFAULT_LATE_FEE_CENTS = 5_000;

export function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

export function centsToDollars(value: number) {
  return value / 100;
}

export function resolveBaseAmountCents(payment: PaymentItem) {
  return payment.baseAmountCents ?? dollarsToCents(payment.amount);
}

export function hasLateFee(payment: PaymentItem, now = new Date()) {
  if (typeof payment.lateFeeCents === "number" && payment.lateFeeCents > 0) {
    return true;
  }

  if (payment.status === "paid") {
    return false;
  }

  const deadline = new Date(payment.dueDate);
  deadline.setDate(deadline.getDate() + LATE_FEE_GRACE_DAYS);
  deadline.setHours(23, 59, 59, 999);
  return now.getTime() > deadline.getTime();
}

export function calculateLateFeeCents(payment: PaymentItem, now = new Date()) {
  if (typeof payment.lateFeeCents === "number") {
    return payment.lateFeeCents;
  }

  return hasLateFee(payment, now) ? DEFAULT_LATE_FEE_CENTS : 0;
}

export function getTotalDueCents(payment: PaymentItem, now = new Date()) {
  return resolveBaseAmountCents(payment) + calculateLateFeeCents(payment, now);
}

export function getCollectedAmountCents(payment: PaymentItem, now = new Date()) {
  if (typeof payment.paidAmountCents === "number") {
    return payment.paidAmountCents;
  }

  return payment.status === "paid" ? getTotalDueCents(payment, now) : 0;
}

export function getOutstandingAmountCents(payment: PaymentItem, now = new Date()) {
  return payment.status === "paid" ? 0 : getTotalDueCents(payment, now);
}

export function createReceiptNumber(now = new Date()) {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LF-${datePart}-${suffix}`;
}

export function createStripeIntentReference(now = new Date()) {
  return `pi_demo_${now.getTime().toString(36)}`;
}

export function getSavedPaymentLabel(method: PaymentMethodType) {
  return method === "ach" ? "Primary checking ending in 4831" : "Visa ending in 4242";
}

export function formatPaymentMethodLabel(method?: PaymentMethodType) {
  if (method === "ach") {
    return "ACH";
  }

  if (method === "card") {
    return "Card";
  }

  return "Not set";
}

export function getPaymentStatusVariant(status: PaymentItem["status"]) {
  if (status === "paid") {
    return "success" as const;
  }

  if (status === "overdue" || status === "failed") {
    return "warning" as const;
  }

  return "secondary" as const;
}
