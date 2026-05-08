"use client";

import { Download, Lock } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { useAppStore } from "@/store/app-store";

export function ReportsPanel() {
  const mode = useAppStore((state) => state.mode);
  const user = useAppStore((state) => state.user);
  const properties = useAppStore((state) => state.properties);
  const jobs = useAppStore((state) => state.jobs);
  const payments = useAppStore((state) => state.payments);
  const expenses = useAppStore((state) => state.expenses);
  const setUpgradeDialogOpen = useAppStore((state) => state.setUpgradeDialogOpen);

  const currentRecordIds = mode === "landlord" ? properties.map((property) => property.id) : jobs.map((job) => job.id);

  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const month = date.toLocaleString("en-US", { month: "short" });
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    const collected = payments
      .filter((payment) => payment.status === "paid" && currentRecordIds.includes(payment.recordId ?? ""))
      .filter((payment) => {
        const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.dueDate);
        return `${paidAt.getFullYear()}-${paidAt.getMonth()}` === monthKey;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    const spend = expenses
      .filter((expense) => currentRecordIds.includes(expense.linkedRecordId ?? ""))
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return `${expenseDate.getFullYear()}-${expenseDate.getMonth()}` === monthKey;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      month,
      collected,
      spend,
      net: collected - spend,
    };
  });

  if (user.tier !== "pro") {
    return (
      <Card className="border-border/70 bg-background/75">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold">Reports are a Pro unlock</h2>
            <p className="max-w-lg text-sm text-muted-foreground">
              Upgrade to unlock unlimited records, cashflow charts, export stubs, and the smart prediction placeholder.
            </p>
          </div>
          <Button onClick={() => setUpgradeDialogOpen(true)}>Upgrade to Pro</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Cashflow report</CardTitle>
              <CardDescription>Six months of collections, spend, and net movement.</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => toast.message("CSV export is stubbed for the MVP, ready for the backend handoff.")}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="collected" stroke="#14b8a6" fill="url(#collected)" strokeWidth={2} />
                <Area type="monotone" dataKey="spend" stroke="#f97316" fill="url(#spend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Net trend</CardTitle>
            <CardDescription>Momentum worth charging for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {chartData.slice(-3).map((entry) => (
              <div key={entry.month} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">{entry.month}</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(entry.net)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Smart prediction placeholder</CardTitle>
            <CardDescription>The future premium feature has a home already.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">Next month projection</p>
              <p className="mt-2 text-lg font-semibold">
                {mode === "landlord" ? "Cashflow should lift 12% if Maple Street pays by the 5th." : "The active job book should close at 38% gross margin."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              Keep the placeholder visible now so the upgrade story lands cleanly once the real model arrives.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
