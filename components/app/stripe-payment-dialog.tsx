"use client";

import { useEffect, useRef, useState } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { centsToDollars } from "@/lib/payment-processing";

export type StripeSettlementStatus = "paid" | "pending" | "failed";

interface StripePaymentDialogProps {
  open: boolean;
  clientSecret: string | null;
  amountCents: number;
  onClose: () => void;
  onSettled: (status: StripeSettlementStatus, failureReason?: string) => void;
}

export function StripePaymentDialog({ open, clientSecret, amountCents, onClose, onSettled }: StripePaymentDialogProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !clientSecret) {
      return;
    }

    let cancelled = false;
    const mountNode = mountRef.current;
    setReady(false);
    setErrorMessage(null);

    async function mount() {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        setErrorMessage("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing. Add it to .env.local to collect card payments.");
        return;
      }

      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(publishableKey);
      if (!stripe || cancelled || !mountRef.current || !clientSecret) {
        return;
      }

      const elements = stripe.elements({ clientSecret, appearance: { theme: "stripe" } });
      const paymentElement = elements.create("payment");
      paymentElement.mount(mountRef.current);
      paymentElement.on("ready", () => {
        if (!cancelled) {
          setReady(true);
        }
      });

      stripeRef.current = stripe;
      elementsRef.current = elements;
    }

    void mount();

    return () => {
      cancelled = true;
      elementsRef.current = null;
      stripeRef.current = null;
      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [open, clientSecret]);

  async function handleConfirm() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: typeof window !== "undefined" ? window.location.href : undefined,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "The payment could not be confirmed.");
        onSettled("failed", result.error.message ?? undefined);
        return;
      }

      const status = result.paymentIntent?.status;
      if (status === "succeeded") {
        onSettled("paid");
      } else {
        // processing / requires_action resolve via the Stripe webhook.
        onSettled("pending");
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-primary" />
            Secure payment
          </DialogTitle>
          <DialogDescription>
            {formatCurrency(centsToDollars(amountCents))} will be charged through Stripe. Card details never touch
            LandlordForge servers.
          </DialogDescription>
        </DialogHeader>

        <div ref={mountRef} className="min-h-[120px]" />
        {!ready && !errorMessage ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading secure payment form
          </div>
        ) : null}
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        <Button className="w-full" size="lg" onClick={handleConfirm} disabled={!ready || submitting}>
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Confirming payment" : `Pay ${formatCurrency(centsToDollars(amountCents))}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
