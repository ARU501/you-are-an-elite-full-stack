"use client";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import { getCurrentDuePayment, getCurrentTenant, getTenantPayments } from "@/lib/role-data";
import { useAppStore } from "@/store/app-store";

export function TenantPayments() {
  const data = useAppStore((state) => state);
  const payRentForCurrentTenant = useAppStore((state) => state.payRentForCurrentTenant);

  const tenant = getCurrentTenant(data);
  if (!tenant) {
    return null;
  }

  const payments = getTenantPayments(data, tenant.id);
  const duePayment = getCurrentDuePayment(data, tenant.id);
  const totalPaid = payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Current due" value={duePayment ? formatCurrency(duePayment.amount) : "Paid up"} />
        <MetricCard title="Paid history" value={formatCurrency(totalPaid)} />
        <MetricCard title="Payment records" value={`${payments.length}`} />
      </div>

      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <CardTitle>Rent history</CardTitle>
          <CardDescription>Use the stub payment action to simulate the tenant payment flow in the beta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{payment.label}</p>
                    <Badge variant={payment.status === "paid" ? "success" : payment.status === "overdue" ? "warning" : "secondary"}>
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Due {formatLongDate(payment.dueDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                  {payment.status !== "paid" ? (
                    <Button
                      onClick={() => {
                        const result = payRentForCurrentTenant();
                        result.ok ? toast.success(result.message) : toast.error(result.message);
                      }}
                    >
                      Pay rent
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
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
