"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Pencil, Plus, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { getPropertyTenants } from "@/lib/role-data";
import { ExpenseDraft, PropertyDraft, PropertyStatus } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const propertyDefaults: PropertyDraft = {
  address: "",
  unitLabel: "",
  monthlyRent: 1500,
  dueDay: 1,
  note: "",
  status: "occupied",
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function LandlordProperties() {
  const router = useRouter();
  const properties = useAppStore((state) => state.properties);
  const tenants = useAppStore((state) => state.tenants);
  const payments = useAppStore((state) => state.payments);
  const requests = useAppStore((state) => state.requests);
  const expenses = useAppStore((state) => state.expenses);
  const addProperty = useAppStore((state) => state.addProperty);
  const updateProperty = useAppStore((state) => state.updateProperty);
  const addExpense = useAppStore((state) => state.addExpense);
  const setSelectedConversationTenantId = useAppStore((state) => state.setSelectedConversationTenantId);

  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [propertyDraft, setPropertyDraft] = useState<PropertyDraft>(propertyDefaults);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>({
    propertyId: properties[0]?.id ?? "",
    title: "",
    category: "Repairs",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const monthlyExpense = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return expenses.filter((expense) => new Date(expense.date) >= monthStart).reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  function openCreateProperty() {
    setEditingPropertyId(null);
    setPropertyDraft(propertyDefaults);
    setPropertyDialogOpen(true);
  }

  function openEditProperty(propertyId: string) {
    const property = properties.find((entry) => entry.id === propertyId);
    if (!property) {
      return;
    }

    setEditingPropertyId(propertyId);
    setPropertyDraft({
      address: property.address,
      unitLabel: property.unitLabel,
      monthlyRent: property.monthlyRent,
      dueDay: property.dueDay,
      note: property.note,
      status: property.status,
    });
    setPropertyDialogOpen(true);
  }

  function handlePropertySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = editingPropertyId ? updateProperty(editingPropertyId, propertyDraft) : addProperty(propertyDraft);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setPropertyDialogOpen(false);
    }
  }

  function handleExpenseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addExpense(expenseDraft);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setExpenseDialogOpen(false);
      setExpenseDraft({
        propertyId: properties[0]?.id ?? "",
        title: "",
        category: "Repairs",
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        note: "",
      });
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Properties</h2>
            <p className="text-sm text-muted-foreground">Portfolio management, payment visibility, request volume, and expenses all tied back to the right home.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExpenseDialogOpen(true)}>
              <ReceiptText className="h-4 w-4" />
              Log expense
            </Button>
            <Button onClick={openCreateProperty}>
              <Plus className="h-4 w-4" />
              Add property
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => {
            const propertyTenants = getPropertyTenants({ tenants }, property.id);
            const outstanding = payments
              .filter((payment) => payment.propertyId === property.id && payment.status !== "paid")
              .reduce((sum, payment) => sum + payment.amount, 0);
            const propertyRequests = requests.filter((request) => request.propertyId === property.id && request.status !== "done");
            const recentExpense = expenses
              .filter((expense) => expense.propertyId === property.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            return (
              <Card key={property.id} className="border-border/70 bg-background/75">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-xl font-semibold">
                        {property.address} {property.unitLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">{propertyTenants.map((tenant) => tenant.name).join(", ")}</p>
                    </div>
                    <Badge variant={property.status === "attention" ? "warning" : "success"}>{property.status}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Monthly rent" value={formatCurrency(property.monthlyRent)} />
                    <MiniMetric label="Outstanding" value={formatCurrency(outstanding)} />
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Open maintenance</p>
                    <p className="mt-1 font-semibold">{propertyRequests.length} active requests</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {recentExpense ? `Latest expense: ${recentExpense.title} on ${formatLongDate(recentExpense.date)}` : "No recent expense logged."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => openEditProperty(property.id)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    {propertyTenants[0] ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedConversationTenantId(propertyTenants[0].id);
                          router.push("/messages");
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message tenant
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Expense pulse</CardTitle>
            <CardDescription>Current month spend across the portfolio: {formatCurrency(monthlyExpense)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((expense) => {
                const property = properties.find((entry) => entry.id === expense.propertyId);
                return (
                  <div key={expense.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {property?.address} {property?.unitLabel}
                        </p>
                      </div>
                      <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPropertyId ? "Edit property" : "Add property"}</DialogTitle>
            <DialogDescription>Keep the landlord-side portfolio dead simple and quick to update.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handlePropertySubmit}>
            <div className="space-y-2">
              <Label htmlFor="property-address">Address</Label>
              <Input
                id="property-address"
                value={propertyDraft.address}
                onChange={(event) => setPropertyDraft((current) => ({ ...current, address: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property-unit">Unit</Label>
                <Input
                  id="property-unit"
                  value={propertyDraft.unitLabel}
                  onChange={(event) => setPropertyDraft((current) => ({ ...current, unitLabel: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-status">Status</Label>
                <select
                  id="property-status"
                  className={selectClassName}
                  value={propertyDraft.status}
                  onChange={(event) =>
                    setPropertyDraft((current) => ({
                      ...current,
                      status: event.target.value as PropertyStatus,
                    }))
                  }
                >
                  <option value="occupied">Occupied</option>
                  <option value="attention">Attention</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property-rent">Monthly rent</Label>
                <Input
                  id="property-rent"
                  type="number"
                  min="0"
                  value={propertyDraft.monthlyRent}
                  onChange={(event) => setPropertyDraft((current) => ({ ...current, monthlyRent: Number(event.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-due-day">Due day</Label>
                <Input
                  id="property-due-day"
                  type="number"
                  min="1"
                  max="28"
                  value={propertyDraft.dueDay}
                  onChange={(event) => setPropertyDraft((current) => ({ ...current, dueDay: Number(event.target.value) || 1 }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-note">Notes</Label>
              <Textarea
                id="property-note"
                value={propertyDraft.note}
                onChange={(event) => setPropertyDraft((current) => ({ ...current, note: event.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPropertyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingPropertyId ? "Save changes" : "Add property"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log expense</DialogTitle>
            <DialogDescription>Expenses stay tied to the exact property they belong to.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleExpenseSubmit}>
            <div className="space-y-2">
              <Label htmlFor="expense-property">Property</Label>
              <select
                id="expense-property"
                className={selectClassName}
                value={expenseDraft.propertyId}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, propertyId: event.target.value }))}
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address} {property.unitLabel}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-title">Title</Label>
              <Input
                id="expense-title"
                value={expenseDraft.title}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Input
                  id="expense-category"
                  value={expenseDraft.category}
                  onChange={(event) => setExpenseDraft((current) => ({ ...current, category: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0"
                  value={expenseDraft.amount}
                  onChange={(event) => setExpenseDraft((current) => ({ ...current, amount: Number(event.target.value) || 0 }))}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDraft.date}
                  onChange={(event) => setExpenseDraft((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-note">Notes</Label>
                <Input
                  id="expense-note"
                  value={expenseDraft.note}
                  onChange={(event) => setExpenseDraft((current) => ({ ...current, note: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
