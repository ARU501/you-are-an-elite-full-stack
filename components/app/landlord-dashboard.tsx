"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BellDot, CircleDollarSign, MessageSquare, Receipt, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatLongDate, formatRelativeTime } from "@/lib/formatters";
import { getConversationMessages, getPropertyTenants, getUnreadMessageCount } from "@/lib/role-data";
import { useAppStore } from "@/store/app-store";

export function LandlordDashboard() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const accounts = useAppStore((state) => state.accounts);
  const properties = useAppStore((state) => state.properties);
  const tenants = useAppStore((state) => state.tenants);
  const payments = useAppStore((state) => state.payments);
  const requests = useAppStore((state) => state.requests);
  const expenses = useAppStore((state) => state.expenses);
  const messages = useAppStore((state) => state.messages);
  const activities = useAppStore((state) => state.activities);
  const markPaymentPaid = useAppStore((state) => state.markPaymentPaid);
  const updateRequestStatus = useAppStore((state) => state.updateRequestStatus);
  const setSelectedConversationTenantId = useAppStore((state) => state.setSelectedConversationTenantId);
  const unreadCount = useAppStore((state) => getUnreadMessageCount(state));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const totalDue = payments.filter((payment) => payment.status !== "paid").reduce((sum, payment) => sum + payment.amount, 0);
  const openRequests = requests.filter((request) => request.status !== "done");
  const monthlyCashflow =
    payments
      .filter((payment) => payment.status === "paid" && payment.paidAt && new Date(payment.paidAt) >= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0) -
    expenses.filter((expense) => new Date(expense.date) >= monthStart).reduce((sum, expense) => sum + expense.amount, 0);

  const duePayments = [...payments]
    .filter((payment) => payment.status !== "paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const tenantInbox = useMemo(
    () =>
      tenants.map((tenant) => {
        const conversation = getConversationMessages(
          {
            accounts,
            tenants,
            messages,
          },
          tenant.id,
        );

        const unread = conversation.filter((message) => message.to === currentUser?.id && !message.read).length;
        return {
          tenant,
          lastMessage: conversation[conversation.length - 1],
          unread,
        };
      }),
    [accounts, currentUser?.id, messages, tenants],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total rent due" value={formatCurrency(totalDue)} icon={CircleDollarSign} />
        <StatCard title="Open requests" value={`${openRequests.length}`} icon={Wrench} />
        <StatCard title="Unread messages" value={`${unreadCount}`} icon={MessageSquare} />
        <StatCard title="Cashflow this month" value={formatCurrency(monthlyCashflow)} icon={Receipt} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Keep the free plan useful enough to stick, with Pro hooks right where the pain shows up.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tenants.map((tenant) => {
              const property = properties.find((entry) => entry.id === tenant.propertyId);
              return (
                <div key={tenant.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {property?.address} {property?.unitLabel}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedConversationTenantId(tenant.id);
                      router.push("/messages");
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message tenant
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Portfolio pulse</CardTitle>
            <CardDescription>Where the day is actually asking for your attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.map((property) => {
              const propertyTenants = getPropertyTenants({ tenants }, property.id);
              const outstanding = payments
                .filter((payment) => payment.propertyId === property.id && payment.status !== "paid")
                .reduce((sum, payment) => sum + payment.amount, 0);

              return (
                <div key={property.id} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {property.address} {property.unitLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">{propertyTenants.map((tenant) => tenant.name).join(", ")}</p>
                    </div>
                    <Badge variant={property.status === "attention" ? "warning" : "success"}>{property.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Outstanding: {formatCurrency(outstanding)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Rent tracker</CardTitle>
            <CardDescription>Manual recording is still here until payments become real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {duePayments.map((payment) => {
              const tenant = tenants.find((entry) => entry.id === payment.tenantId);
              return (
                <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.label}</p>
                        <Badge variant={payment.status === "overdue" ? "warning" : "secondary"}>{payment.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tenant?.name} - due {formatLongDate(payment.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                      <Button
                        onClick={() => {
                          const result = markPaymentPaid(payment.id);
                          result.ok ? toast.success(result.message) : toast.error(result.message);
                        }}
                      >
                        Record payment
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Maintenance board</CardTitle>
            <CardDescription>Requests seeded with enough life that the beta feels real immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openRequests.map((request) => {
              const tenant = tenants.find((entry) => entry.id === request.tenantId);
              return (
                <div key={request.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant?.name} - {formatRelativeTime(request.createdAt)}
                      </p>
                    </div>
                    <Badge variant={request.priority === "high" ? "warning" : "secondary"}>{request.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{request.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["open", "in-progress", "done"] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={request.status === status ? "default" : "outline"}
                        onClick={() => {
                          const result = updateRequestStatus(request.id, status);
                          result.ok ? toast.success(result.message) : toast.error(result.message);
                        }}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inbox snapshot</CardTitle>
              <Badge variant="secondary">{tenantInbox.filter((entry) => entry.unread > 0).length} active</Badge>
            </div>
            <CardDescription>Unread counts and last-message previews from every tenant thread.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenantInbox.map((entry) => (
              <button
                key={entry.tenant.id}
                type="button"
                className="w-full rounded-2xl border border-border/70 bg-background/70 p-4 text-left transition hover:border-primary/35"
                onClick={() => {
                  setSelectedConversationTenantId(entry.tenant.id);
                  router.push("/messages");
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                  {entry.unread > 0 ? <Badge>{entry.unread}</Badge> : <BellDot className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>The live feed should make the product feel staffed, not empty.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <Card className="border-border/70 bg-background/75">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 font-heading text-3xl font-semibold">{value}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


