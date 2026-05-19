"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, ReceiptText, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatLongDate, formatRelativeTime } from "@/lib/formatters";
import { getConversationMessages, getCurrentDuePayment, getCurrentProperty, getCurrentTenant, getTenantRequests } from "@/lib/role-data";
import { MaintenanceRequestDraft, Priority } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TenantHome() {
  const currentUser = useAppStore((state) => state.currentUser);
  const submitMaintenanceRequest = useAppStore((state) => state.submitMaintenanceRequest);
  const data = useAppStore((state) => state);
  const [requestDraft, setRequestDraft] = useState<MaintenanceRequestDraft>({
    title: "",
    detail: "",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const tenant = getCurrentTenant(data);
  const property = getCurrentProperty(data);
  const duePayment = tenant ? getCurrentDuePayment(data, tenant.id) : undefined;
  const requests = tenant ? getTenantRequests(data, tenant.id).slice(0, 3) : [];
  const conversation = tenant ? getConversationMessages(data, tenant.id) : [];
  const latestLandlordMessage = [...conversation].reverse().find((message) => message.from !== currentUser?.id);

  if (!tenant || !property) {
    return null;
  }

  function handleRequestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = submitMaintenanceRequest(requestDraft);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setRequestDraft({
        title: "",
        detail: "",
        priority: "medium",
        dueDate: new Date().toISOString().slice(0, 10),
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>My property</CardTitle>
            <CardDescription>Your portal is scoped to this home only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl font-semibold">
                    {property.address} {property.unitLabel}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{tenant.leaseLabel}</p>
                </div>
                <Badge variant={duePayment?.status === "overdue" ? "warning" : "secondary"}>
                  {duePayment?.status ?? "current"}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoChip label="Monthly rent" value={formatCurrency(property.monthlyRent)} />
                <InfoChip label="Next due date" value={duePayment ? formatLongDate(duePayment.dueDate) : "Paid up"} />
                <InfoChip label="Property status" value={property.status} />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/payments">
                    <ReceiptText className="h-4 w-4" />
                    Open payment portal
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/requests">
                    <Wrench className="h-4 w-4" />
                    View all requests
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Direct line to your landlord</CardTitle>
            <CardDescription>Messages and request updates stay in one thread.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Inbox</p>
                  <p className="text-sm text-muted-foreground">
                    {latestLandlordMessage ? formatRelativeTime(latestLandlordMessage.timestamp) : "No recent landlord messages"}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/messages">
                    <MessageSquare className="h-4 w-4" />
                    Open messages
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {latestLandlordMessage?.content ?? "Your landlord thread is ready when you need it."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Recent requests</p>
                <Badge variant="secondary">{requests.length}</Badge>
              </div>
              {requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{request.title}</p>
                    <Badge variant={request.status === "done" ? "success" : "secondary"}>{request.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{request.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <CardTitle>Submit maintenance request</CardTitle>
          <CardDescription>Send the issue straight into your landlord&apos;s task queue and message thread.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]" onSubmit={handleRequestSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="home-request-title">Title</Label>
                <Input
                  id="home-request-title"
                  value={requestDraft.title}
                  onChange={(event) => setRequestDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: Kitchen faucet leak"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home-request-detail">Detail</Label>
                <Textarea
                  id="home-request-detail"
                  value={requestDraft.detail}
                  onChange={(event) => setRequestDraft((current) => ({ ...current, detail: event.target.value }))}
                  placeholder="Tell your landlord what is happening, what you already tried, and the best access window."
                  required
                />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="space-y-2">
                <Label htmlFor="home-request-priority">Priority</Label>
                <select
                  id="home-request-priority"
                  className={selectClassName}
                  value={requestDraft.priority}
                  onChange={(event) =>
                    setRequestDraft((current) => ({
                      ...current,
                      priority: event.target.value as Priority,
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="home-request-date">Preferred date</Label>
                <Input
                  id="home-request-date"
                  type="date"
                  value={requestDraft.dueDate}
                  onChange={(event) => setRequestDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit request
              </Button>
              <p className="text-sm text-muted-foreground">
                The landlord gets both the task and an inbox message, so the request never disappears into a side system.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
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
