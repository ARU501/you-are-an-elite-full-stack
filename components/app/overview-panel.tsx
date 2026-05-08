"use client";

import { Activity, BarChart3, BrainCircuit, Building2, CircleDollarSign, Hammer, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatRelativeTime, isDatePast } from "@/lib/formatters";
import { useAppStore } from "@/store/app-store";

export function OverviewPanel() {
  const mode = useAppStore((state) => state.mode);
  const user = useAppStore((state) => state.user);
  const properties = useAppStore((state) => state.properties);
  const jobs = useAppStore((state) => state.jobs);
  const payments = useAppStore((state) => state.payments);
  const tasks = useAppStore((state) => state.tasks);
  const expenses = useAppStore((state) => state.expenses);
  const activities = useAppStore((state) => state.activities);
  const setUpgradeDialogOpen = useAppStore((state) => state.setUpgradeDialogOpen);

  const currentRecordIds = mode === "landlord" ? properties.map((property) => property.id) : jobs.map((job) => job.id);
  const relevantPayments = payments.filter((payment) => currentRecordIds.includes(payment.recordId ?? ""));
  const relevantTasks = tasks.filter((task) => task.mode === mode);
  const relevantExpenses = expenses.filter((expense) => currentRecordIds.includes(expense.linkedRecordId ?? ""));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const totalDue = relevantPayments
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const openTasks = relevantTasks.filter((task) => task.status !== "done").length;
  const activeRecords = currentRecordIds.length;
  const monthlyCashflow =
    relevantPayments
      .filter((payment) => payment.status === "paid" && payment.paidAt && new Date(payment.paidAt) >= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0) -
    relevantExpenses
      .filter((expense) => new Date(expense.date) >= monthStart)
      .reduce((sum, expense) => sum + expense.amount, 0);

  const nextDue = relevantPayments
    .filter((payment) => payment.status !== "paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const statCards = [
    {
      title: mode === "landlord" ? "Total Rent Due" : "Outstanding Invoices",
      value: formatCurrency(totalDue),
      icon: CircleDollarSign,
    },
    {
      title: mode === "landlord" ? "Open Maintenance" : "Open Tasks",
      value: `${openTasks}`,
      icon: Wrench,
    },
    {
      title: mode === "landlord" ? "Active Properties" : "Active Jobs",
      value: `${activeRecords}`,
      icon: mode === "landlord" ? Building2 : Hammer,
    },
    {
      title: "Cashflow this month",
      value: formatCurrency(monthlyCashflow),
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} className="border-border/70 bg-background/75">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="mt-3 font-heading text-3xl font-semibold">{card.value}</p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Keep the latest money, maintenance, and record changes in one stream.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{activity.title}</p>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s pulse</CardTitle>
              <Badge variant={nextDue && isDatePast(nextDue.dueDate) ? "warning" : "secondary"}>
                {nextDue ? "Live" : "Clear"}
              </Badge>
            </div>
            <CardDescription>What needs attention next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextDue ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">{mode === "landlord" ? "Next payment" : "Next invoice"}</p>
                <p className="mt-2 text-lg font-semibold">{nextDue.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(nextDue.amount)} due {formatRelativeTime(nextDue.dueDate)}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No open payments right now.
              </div>
            )}

            {relevantTasks.slice(0, 2).map((task) => (
              <div key={task.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{task.title}</p>
                  <Badge variant={task.status === "done" ? "success" : "secondary"}>{task.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{task.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Smart predictions
              </CardTitle>
              <Badge variant={user.tier === "pro" ? "success" : "outline"}>{user.tier === "pro" ? "Pro" : "Locked"}</Badge>
            </div>
            <CardDescription>Early churn and cashflow nudges that make the upgrade sticky.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.tier === "pro" ? (
              <>
                <div className="rounded-2xl border border-border/70 bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Collection risk</p>
                  <p className="mt-2 text-lg font-semibold">Maple Street has a 68% chance of paying after reminder 2.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-sm text-muted-foreground">Margin signal</p>
                  <p className="mt-2 text-lg font-semibold">
                    {mode === "landlord" ? "Maintenance spend should normalize next month." : "Summit Dental will likely close above 42% gross margin."}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">
                  Unlock cashflow forecasting, late-payment risk, and AI placeholders with Pro.
                </p>
                <Button className="mt-4 w-full" onClick={() => setUpgradeDialogOpen(true)}>
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
