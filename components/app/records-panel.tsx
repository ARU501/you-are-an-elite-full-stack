"use client";

import { useState } from "react";
import { Building2, CalendarDays, Hammer, Pencil, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import { JobDraft, PropertyDraft } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const emptyPropertyDraft: PropertyDraft = {
  address: "",
  tenantName: "",
  rentAmount: 1500,
  dueDay: 1,
  note: "",
};

const emptyJobDraft: JobDraft = {
  clientName: "",
  description: "",
  amount: 900,
  dueDate: new Date().toISOString().slice(0, 10),
  note: "",
};

export function RecordsPanel() {
  const mode = useAppStore((state) => state.mode);
  const user = useAppStore((state) => state.user);
  const properties = useAppStore((state) => state.properties);
  const jobs = useAppStore((state) => state.jobs);
  const addProperty = useAppStore((state) => state.addProperty);
  const updateProperty = useAppStore((state) => state.updateProperty);
  const addJob = useAppStore((state) => state.addJob);
  const updateJob = useAppStore((state) => state.updateJob);
  const setUpgradeDialogOpen = useAppStore((state) => state.setUpgradeDialogOpen);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [propertyDraft, setPropertyDraft] = useState<PropertyDraft>(emptyPropertyDraft);
  const [jobDraft, setJobDraft] = useState<JobDraft>(emptyJobDraft);

  const atFreeLimit = user.tier === "free" && (mode === "landlord" ? properties.length >= 2 : jobs.length >= 2);

  function openCreate() {
    if (atFreeLimit) {
      setUpgradeDialogOpen(true);
      return;
    }

    setEditingId(null);
    setPropertyDraft(emptyPropertyDraft);
    setJobDraft(emptyJobDraft);
    setOpen(true);
  }

  function openPropertyEdit(id: string) {
    const property = properties.find((entry) => entry.id === id);
    if (!property) {
      return;
    }

    setEditingId(id);
    setPropertyDraft({
      address: property.address,
      tenantName: property.tenantName,
      rentAmount: property.rentAmount,
      dueDay: property.dueDay,
      note: property.note ?? "",
    });
    setOpen(true);
  }

  function openJobEdit(id: string) {
    const job = jobs.find((entry) => entry.id === id);
    if (!job) {
      return;
    }

    setEditingId(id);
    setJobDraft({
      clientName: job.clientName,
      description: job.description,
      amount: job.amount,
      dueDate: job.dueDate.slice(0, 10),
      note: job.note ?? "",
    });
    setOpen(true);
  }

  function handlePropertySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = editingId ? updateProperty(editingId, propertyDraft) : addProperty(propertyDraft);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setOpen(false);
  }

  function handleJobSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = editingId ? updateJob(editingId, jobDraft) : addJob(jobDraft);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setOpen(false);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              {mode === "landlord" ? "Properties" : "Jobs"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "landlord"
                ? "Track rent-ready units, due dates, and the tenant tied to each address."
                : "Track each client, scope, and amount due without opening a spreadsheet."}
            </p>
          </div>
          <div className="flex gap-2">
            {atFreeLimit && <Badge variant="warning">Free limit reached</Badge>}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {mode === "landlord" ? "Add property" : "Add job"}
            </Button>
          </div>
        </div>

        {mode === "landlord" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map((property) => (
              <Card key={property.id} className="border-border/70 bg-background/75">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        Property
                      </div>
                      <h3 className="mt-2 font-heading text-xl font-semibold">{property.address}</h3>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => openPropertyEdit(property.id)} aria-label="Edit property">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <p className="text-muted-foreground">Tenant</p>
                      <p className="mt-1 font-semibold">{property.tenantName}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <p className="text-muted-foreground">Monthly rent</p>
                      <p className="mt-1 font-semibold">{formatCurrency(property.rentAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Due on day {property.dueDay}
                    </div>
                    <Badge variant="secondary">Tracked</Badge>
                  </div>
                  {property.note ? <p className="text-sm text-muted-foreground">{property.note}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <Card key={job.id} className="border-border/70 bg-background/75">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hammer className="h-4 w-4" />
                        Active job
                      </div>
                      <h3 className="mt-2 font-heading text-xl font-semibold">{job.clientName}</h3>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => openJobEdit(job.id)} aria-label="Edit job">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Scope</p>
                    <p className="mt-1 font-medium">{job.description}</p>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="text-muted-foreground">Amount</p>
                      <p className="mt-1 font-semibold">{formatCurrency(job.amount)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="text-muted-foreground">Due date</p>
                      <p className="mt-1 font-semibold">{formatLongDate(job.dueDate)}</p>
                    </div>
                  </div>
                  {job.note ? <p className="text-sm text-muted-foreground">{job.note}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add"} {mode === "landlord" ? "recorded property" : "active job"}
            </DialogTitle>
            <DialogDescription>
              {mode === "landlord"
                ? "Capture the address, rent, and tenant in under a minute."
                : "Capture the client, scope, amount, and due date in under a minute."}
            </DialogDescription>
          </DialogHeader>

          {mode === "landlord" ? (
            <form className="space-y-4" onSubmit={handlePropertySubmit}>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={propertyDraft.address}
                  onChange={(event) => setPropertyDraft((current) => ({ ...current, address: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant</Label>
                <Input
                  id="tenantName"
                  value={propertyDraft.tenantName}
                  onChange={(event) => setPropertyDraft((current) => ({ ...current, tenantName: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Rent amount</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    min="0"
                    value={propertyDraft.rentAmount}
                    onChange={(event) =>
                      setPropertyDraft((current) => ({ ...current, rentAmount: Number(event.target.value) || 0 }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Due day</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="28"
                    value={propertyDraft.dueDay}
                    onChange={(event) =>
                      setPropertyDraft((current) => ({ ...current, dueDay: Number(event.target.value) || 1 }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyNote">Notes</Label>
                <Textarea
                  id="propertyNote"
                  value={propertyDraft.note}
                  onChange={(event) => setPropertyDraft((current) => ({ ...current, note: event.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Save changes" : "Add property"}</Button>
              </DialogFooter>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleJobSubmit}>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client</Label>
                <Input
                  id="clientName"
                  value={jobDraft.clientName}
                  onChange={(event) => setJobDraft((current) => ({ ...current, clientName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job description</Label>
                <Textarea
                  id="description"
                  value={jobDraft.description}
                  onChange={(event) => setJobDraft((current) => ({ ...current, description: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobAmount">Amount</Label>
                  <Input
                    id="jobAmount"
                    type="number"
                    min="0"
                    value={jobDraft.amount}
                    onChange={(event) => setJobDraft((current) => ({ ...current, amount: Number(event.target.value) || 0 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={jobDraft.dueDate}
                    onChange={(event) => setJobDraft((current) => ({ ...current, dueDate: event.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobNote">Notes</Label>
                <Textarea
                  id="jobNote"
                  value={jobDraft.note}
                  onChange={(event) => setJobDraft((current) => ({ ...current, note: event.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Save changes" : "Add job"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
