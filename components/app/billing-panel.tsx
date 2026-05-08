"use client";

import { useState } from "react";
import { FileText, ReceiptText, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatLongDate, isDatePast } from "@/lib/formatters";
import { useAppStore } from "@/store/app-store";

export function BillingPanel() {
  const mode = useAppStore((state) => state.mode);
  const properties = useAppStore((state) => state.properties);
  const jobs = useAppStore((state) => state.jobs);
  const contacts = useAppStore((state) => state.contacts);
  const payments = useAppStore((state) => state.payments);
  const markPaymentPaid = useAppStore((state) => state.markPaymentPaid);

  const [previewId, setPreviewId] = useState<string | null>(null);

  const currentRecordIds = mode === "landlord" ? properties.map((property) => property.id) : jobs.map((job) => job.id);
  const filteredPayments = payments
    .filter((payment) => currentRecordIds.includes(payment.recordId ?? ""))
    .map((payment) =>
      payment.status === "due" && isDatePast(payment.dueDate) ? { ...payment, status: "overdue" as const } : payment,
    );

  const totalDue = filteredPayments
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const overdueCount = filteredPayments.filter((payment) => payment.status === "overdue").length;
  const paidThisMonth = filteredPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const previewPayment = filteredPayments.find((payment) => payment.id === previewId) ?? null;
  const previewContact = previewPayment ? contacts.find((contact) => contact.id === previewPayment.contactId) : null;

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-background/75">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{mode === "landlord" ? "Rent due" : "Invoices due"}</p>
              <p className="mt-3 font-heading text-3xl font-semibold">{formatCurrency(totalDue)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/75">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Overdue alerts</p>
              <p className="mt-3 font-heading text-3xl font-semibold">{overdueCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/75">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Paid tracked total</p>
              <p className="mt-3 font-heading text-3xl font-semibold">{formatCurrency(paidThisMonth)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>{mode === "landlord" ? "Rent tracking" : "Invoice tracking"}</CardTitle>
            <CardDescription>
              Mark payments paid, flag overdue items, and preview a lightweight PDF invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payment.label}</p>
                      <Badge
                        variant={
                          payment.status === "paid" ? "success" : payment.status === "overdue" ? "warning" : "secondary"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatCurrency(payment.amount)} due {formatLongDate(payment.dueDate)}
                    </p>
                    {payment.status === "overdue" ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-xs font-medium text-warning-foreground">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        Overdue alert active
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => setPreviewId(payment.id)}>
                      <FileText className="h-4 w-4" />
                      PDF preview stub
                    </Button>
                    {payment.status !== "paid" ? (
                      <Button
                        onClick={() => {
                          markPaymentPaid(payment.id);
                          toast.success("Payment marked paid.");
                        }}
                      >
                        <ReceiptText className="h-4 w-4" />
                        Mark paid
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(previewId)} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice PDF preview</DialogTitle>
            <DialogDescription>
              Lean placeholder for the production PDF generator. The totals and recipient are already wired.
            </DialogDescription>
          </DialogHeader>
          {previewPayment ? (
            <div className="rounded-3xl border border-border/70 bg-background/75 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-2xl font-semibold">LandlordForge Invoice</p>
                  <p className="text-sm text-muted-foreground">Preview only</p>
                </div>
                <Badge variant={previewPayment.status === "paid" ? "success" : "secondary"}>{previewPayment.status}</Badge>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Bill to</p>
                  <p className="mt-2 font-medium">{previewContact?.displayName ?? "Unassigned contact"}</p>
                  <p className="text-sm text-muted-foreground">{previewContact?.email ?? "contact@example.com"}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Amount due</p>
                  <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(previewPayment.amount)}</p>
                  <p className="text-sm text-muted-foreground">Due {formatLongDate(previewPayment.dueDate)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="font-medium">{previewPayment.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  PDF rendering, branding, tax fields, and signatures are intentionally stubbed for the MVP.
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewId(null)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => toast.message("PDF export stub connected. Final download lands in the next backend pass.")}
            >
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
