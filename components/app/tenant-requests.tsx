"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate, formatRelativeTime } from "@/lib/formatters";
import { getCurrentTenant, getTenantRequests } from "@/lib/role-data";
import { MaintenanceRequestDraft, Priority } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TenantRequests() {
  const data = useAppStore((state) => state);
  const submitMaintenanceRequest = useAppStore((state) => state.submitMaintenanceRequest);
  const tenant = getCurrentTenant(data);
  const requests = tenant ? getTenantRequests(data, tenant.id) : [];

  const [draft, setDraft] = useState<MaintenanceRequestDraft>({
    title: "",
    detail: "",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  if (!tenant) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = submitMaintenanceRequest(draft);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setDraft({
        title: "",
        detail: "",
        priority: "medium",
        dueDate: new Date().toISOString().slice(0, 10),
      });
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <CardTitle>Submit maintenance request</CardTitle>
          <CardDescription>Create the task and auto-message the landlord in one move.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="request-title">Title</Label>
              <Input
                id="request-title"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-detail">Detail</Label>
              <Textarea
                id="request-detail"
                value={draft.detail}
                onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="request-priority">Priority</Label>
                <select
                  id="request-priority"
                  className={selectClassName}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
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
                <Label htmlFor="request-due">Preferred date</Label>
                <Input
                  id="request-due"
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Submit request
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <CardTitle>Request history</CardTitle>
          <CardDescription>Tenants only see the requests attached to their own home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{request.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(request.createdAt)} - preferred by {formatLongDate(request.dueDate)}
                  </p>
                </div>
                <Badge variant={request.status === "done" ? "success" : request.priority === "high" ? "warning" : "secondary"}>
                  {request.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{request.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


