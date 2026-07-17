"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Landmark, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StripePaymentDialog, StripeSettlementStatus } from "@/components/app/stripe-payment-dialog";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import {
  centsToDollars,
  formatPaymentMethodLabel,
  getPaymentStatusVariant,
  getSavedPaymentLabel,
  getTotalDueCents,
  resolveBaseAmountCents,
} from "@/lib/payment-processing";
import { getCurrentDuePayment, getCurrentTenant, getCurrentTenantPaymentProfile, getTenantPayments } from "@/lib/role-data";
import { PaymentIntentResponse, PaymentMethodType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const paymentMethodOptions: Array<{
  value: PaymentMethodType;
  label: string;
  detail: string;
  icon: typeof Landmark;
}> = [
  {
    value: "ach",
    label: "ACH bank transfer",
    detail: "Lower fee path for rent collection.",
    icon: Landmark,
  },
  {
    value: "card",
    label: "Debit or credit card",
    detail: "Fast fallback for one-off payments.",
    icon: CreditCard,
  },
];

export function TenantPayments() {
  const data = useAppStore((state) => state);
  const payRentForCurrentTenant = useAppStore((state) => state.payRentForCurrentTenant);
  const updateCurrentTenantPaymentProfile = useAppStore((state) => state.updateCurrentTenantPaymentProfile);

  const tenant = getCurrentTenant(data);
  const profile = getCurrentTenantPaymentProfile(data);
  const payments = tenant ? getTenantPayments(data, tenant.id) : [];
  const duePayment = tenant ? getCurrentDuePayment(data, tenant.id) : undefined;
  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + centsToDollars(payment.paidAmountCents ?? 0), 0);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(profile?.autopayMethod ?? "ach");
  const [autopayEnabled, setAutopayEnabled] = useState(profile?.autopayEnabled ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMode, setLastMode] = useState<PaymentIntentResponse["mode"]>("demo");
  const [stripeSession, setStripeSession] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    paymentId: string;
    amountCents: number;
  } | null>(null);

  useEffect(() => {
    setSelectedMethod(profile?.autopayMethod ?? "ach");
    setAutopayEnabled(profile?.autopayEnabled ?? false);
  }, [profile?.autopayEnabled, profile?.autopayMethod]);

  const dueBreakdown = useMemo(() => {
    if (!duePayment) {
      return null;
    }

    const baseAmountCents = resolveBaseAmountCents(duePayment);
    const totalAmountCents = getTotalDueCents(duePayment);
    const lateFeeCents = totalAmountCents - baseAmountCents;

    return {
      baseAmountCents,
      lateFeeCents,
      totalAmountCents,
    };
  }, [duePayment]);

  if (!tenant) {
    return null;
  }

  const tenantId = tenant.id;

  async function handlePaymentSubmit() {
    if (!duePayment || !dueBreakdown) {
      toast.message("You are paid up right now.");
      return;
    }

    setIsSubmitting(true);

    const profileResult = await updateCurrentTenantPaymentProfile({
      autopayEnabled,
      autopayMethod: selectedMethod,
      savedPaymentLabel: getSavedPaymentLabel(selectedMethod),
      notificationChannels: profile?.notificationChannels ?? ["email"],
    });

    if (!profileResult.ok) {
      setIsSubmitting(false);
      toast.error(profileResult.message);
      return;
    }

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: duePayment.id,
          tenantId,
          amountCents: dueBreakdown.totalAmountCents,
          method: selectedMethod,
          autopay: autopayEnabled,
        }),
      });

      const payload = (await response.json()) as PaymentIntentResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? payload.message ?? "Payment intent request failed.");
      }

      setLastMode(payload.mode);

      if (payload.mode === "stripe" && payload.clientSecret) {
        // Hand off to Stripe's secure payment element. Settlement lands
        // through onSettled below and the Stripe webhook server-side.
        setStripeSession({
          clientSecret: payload.clientSecret,
          paymentIntentId: payload.paymentIntentId,
          paymentId: duePayment.id,
          amountCents: payload.amountCents,
        });
        return;
      }

      const settlementResult = await payRentForCurrentTenant({
        paymentId: duePayment.id,
        paymentMethod: selectedMethod,
        paymentStatus: payload.status,
        stripePaymentIntentId: payload.paymentIntentId,
        receiptNumber: payload.receiptNumber,
        paidAmountCents: payload.status === "paid" ? payload.amountCents : undefined,
        failureReason: payload.status === "failed" ? payload.error ?? payload.message : undefined,
      });

      if (!settlementResult.ok) {
        toast.error(settlementResult.message);
        return;
      }

      toast.success(payload.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not start the payment flow.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStripeSettled(status: StripeSettlementStatus, failureReason?: string) {
    if (!stripeSession) {
      return;
    }

    const settlementResult = await payRentForCurrentTenant({
      paymentId: stripeSession.paymentId,
      paymentMethod: selectedMethod,
      paymentStatus: status,
      stripePaymentIntentId: stripeSession.paymentIntentId,
      paidAmountCents: status === "paid" ? stripeSession.amountCents : undefined,
      failureReason,
    });

    settlementResult.ok ? toast.success(settlementResult.message) : toast.error(settlementResult.message);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Current due" value={dueBreakdown ? formatCurrency(centsToDollars(dueBreakdown.totalAmountCents)) : "Paid up"} />
        <MetricCard title="Paid this portal" value={formatCurrency(totalPaid)} />
        <MetricCard title="Payment records" value={`${payments.length}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Rent payment portal</CardTitle>
                <CardDescription>Pay by card or bank through Stripe, or record a manual payment when Stripe is not connected.</CardDescription>
              </div>
              <Badge variant={lastMode === "stripe" ? "default" : "secondary"}>
                {lastMode === "stripe" ? "Stripe live" : "Manual mode"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-2xl font-semibold">{duePayment?.label ?? "All rent settled"}</p>
                    {duePayment ? <Badge variant={getPaymentStatusVariant(duePayment.status)}>{duePayment.status}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {duePayment ? `Due ${formatLongDate(duePayment.dueDate)}` : "There is no open balance on your account."}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-muted-foreground">Total to charge</p>
                  <p className="mt-1 font-heading text-3xl font-semibold">
                    {dueBreakdown ? formatCurrency(centsToDollars(dueBreakdown.totalAmountCents)) : formatCurrency(0)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoChip label="Base rent" value={dueBreakdown ? formatCurrency(centsToDollars(dueBreakdown.baseAmountCents)) : formatCurrency(0)} />
                <InfoChip label="Late fee" value={dueBreakdown ? formatCurrency(centsToDollars(dueBreakdown.lateFeeCents)) : formatCurrency(0)} />
                <InfoChip label="Saved method" value={profile?.savedPaymentLabel ?? "No saved method yet"} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Choose payment method</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentMethodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedMethod(option.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedMethod === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border/70 bg-background/70 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                          <option.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{option.detail}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4">
                <div>
                  <p className="font-medium">Enable autopay</p>
                  <p className="text-sm text-muted-foreground">Save this method for next month&apos;s rent collection.</p>
                </div>
                <Switch checked={autopayEnabled} onCheckedChange={setAutopayEnabled} />
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                With Stripe connected, payments run through Stripe&apos;s secure payment element and settle
                automatically via webhooks. Without Stripe keys, payments are recorded as received manually (check,
                Zelle, cash) and your landlord is notified instantly.
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!duePayment || duePayment.status === "pending" || isSubmitting}
                onClick={handlePaymentSubmit}
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSubmitting
                  ? "Starting payment flow"
                  : duePayment?.status === "pending"
                    ? "Payment processing"
                    : duePayment
                      ? "Pay rent now"
                      : "No payment due"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Portal settings</CardTitle>
            <CardDescription>What the landlord and processor should already know before money starts moving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Tenant payment profile</p>
                  <p className="text-sm text-muted-foreground">{profile?.stripeCustomerId || "Synced to your account across devices."}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <SettingRow label="Autopay" value={autopayEnabled ? "Enabled" : "Off"} />
                <SettingRow label="Method" value={formatPaymentMethodLabel(selectedMethod)} />
                <SettingRow label="Saved label" value={profile?.savedPaymentLabel ?? getSavedPaymentLabel(selectedMethod)} />
                <SettingRow
                  label="Notifications"
                  value={(profile?.notificationChannels ?? ["email"]).map((channel) => channel.toUpperCase()).join(", ")}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <p className="font-medium">Payment history</p>
              <div className="mt-4 space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{payment.label}</p>
                          <Badge variant={getPaymentStatusVariant(payment.status)}>{payment.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Due {formatLongDate(payment.dueDate)}
                          {payment.receiptNumber ? ` - ${payment.receiptNumber}` : ""}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(centsToDollars(payment.status === "paid" ? payment.paidAmountCents ?? 0 : getTotalDueCents(payment)))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StripePaymentDialog
        open={Boolean(stripeSession)}
        clientSecret={stripeSession?.clientSecret ?? null}
        amountCents={stripeSession?.amountCents ?? 0}
        onClose={() => setStripeSession(null)}
        onSettled={handleStripeSettled}
      />
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/70 bg-background/75">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-3 font-heading text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
