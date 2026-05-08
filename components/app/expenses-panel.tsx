"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import { ExpenseDraft } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ExpensesPanel() {
  const mode = useAppStore((state) => state.mode);
  const properties = useAppStore((state) => state.properties);
  const jobs = useAppStore((state) => state.jobs);
  const expenses = useAppStore((state) => state.expenses);
  const addExpense = useAppStore((state) => state.addExpense);

  const recordOptions =
    mode === "landlord"
      ? properties.map((property) => ({ id: property.id, label: property.address }))
      : jobs.map((job) => ({ id: job.id, label: job.clientName }));
  const currentRecordIds = recordOptions.map((option) => option.id);
  const filteredExpenses = expenses.filter((expense) => currentRecordIds.includes(expense.linkedRecordId ?? ""));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthExpenses = filteredExpenses.filter((expense) => new Date(expense.date) >= monthStart);
  const monthlyTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerRecord = currentRecordIds.length > 0 ? monthlyTotal / currentRecordIds.length : 0;
  const categoryTotals = monthExpenses.reduce<Record<string, number>>((accumulator, expense) => {
    accumulator[expense.category] = (accumulator[expense.category] ?? 0) + expense.amount;
    return accumulator;
  }, {});
  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? (mode === "landlord" ? "Repairs" : "Materials");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>({
    title: "",
    category: mode === "landlord" ? "Repairs" : "Materials",
    linkedRecordId: recordOptions[0]?.id,
    linkedName: recordOptions[0]?.label ?? "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  function openDialog() {
    setDraft({
      title: "",
      category: mode === "landlord" ? "Repairs" : "Materials",
      linkedRecordId: recordOptions[0]?.id,
      linkedName: recordOptions[0]?.label ?? "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addExpense(draft);
    toast.success("Expense logged.");
    setOpen(false);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Expenses</h2>
            <p className="text-sm text-muted-foreground">Tie every spend line back to a property or job and keep monthly totals honest.</p>
          </div>
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            Log expense
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-background/75">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">This month</p>
              <p className="mt-3 font-heading text-3xl font-semibold">{formatCurrency(monthlyTotal)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/75">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Average per {mode === "landlord" ? "property" : "job"}</p>
              <p className="mt-3 font-heading text-3xl font-semibold">{formatCurrency(averagePerRecord)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/75">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Top category</p>
              <p className="mt-3 font-heading text-3xl font-semibold">{topCategory}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Monthly summary</CardTitle>
            <CardDescription>Simple, sticky bookkeeping that keeps the close-out lightweight.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.linkedName} • {expense.category}
                    </p>
                    {expense.note ? <p className="mt-2 text-sm text-muted-foreground">{expense.note}</p> : null}
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="font-heading text-2xl font-semibold">{formatCurrency(expense.amount)}</p>
                    <p className="text-sm text-muted-foreground">{formatLongDate(expense.date)}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No expenses logged for this mode yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log expense</DialogTitle>
            <DialogDescription>Fast entry is the whole point. Save it before the receipt gets lost.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="expenseTitle">Title</Label>
              <Input
                id="expenseTitle"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expenseCategory">Category</Label>
                <Input
                  id="expenseCategory"
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseAmount">Amount</Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  min="0"
                  value={draft.amount}
                  onChange={(event) => setDraft((current) => ({ ...current, amount: Number(event.target.value) || 0 }))}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expenseRecord">Linked record</Label>
                <select
                  id="expenseRecord"
                  className={selectClassName}
                  value={draft.linkedRecordId}
                  onChange={(event) => {
                    const selected = recordOptions.find((option) => option.id === event.target.value);
                    setDraft((current) => ({
                      ...current,
                      linkedRecordId: event.target.value,
                      linkedName: selected?.label ?? "",
                    }));
                  }}
                >
                  {recordOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseNote">Notes</Label>
              <Textarea
                id="expenseNote"
                value={draft.note}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
