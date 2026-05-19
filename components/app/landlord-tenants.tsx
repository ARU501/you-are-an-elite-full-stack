"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Mail, MapPinned, MessageSquare, Phone, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import { centsToDollars, getCollectedAmountCents, getOutstandingAmountCents, getPaymentStatusVariant } from "@/lib/payment-processing";
import { getTenantPayments, getTenantRequests, getUnreadMessageCount } from "@/lib/role-data";
import { useAppStore } from "@/store/app-store";

export function LandlordTenants() {
  const router = useRouter();
  const data = useAppStore((state) => state);
  const setSelectedConversationTenantId = useAppStore((state) => state.setSelectedConversationTenantId);
  const [search, setSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(data.tenants[0]?.id ?? null);
  const deferredSearch = useDeferredValue(search);

  const filteredTenants = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return data.tenants.filter((tenant) => {
      if (!query) {
        return true;
      }
      const property = data.properties.find((entry) => entry.id === tenant.propertyId);
      return `${tenant.name} ${tenant.email} ${tenant.phone} ${property?.address ?? ""}`.toLowerCase().includes(query);
    });
  }, [data.properties, data.tenants, deferredSearch]);

  const selectedTenant =
    filteredTenants.find((tenant) => tenant.id === selectedTenantId) ?? filteredTenants[0] ?? data.tenants[0];
  const property = selectedTenant ? data.properties.find((entry) => entry.id === selectedTenant.propertyId) : undefined;
  const payments = selectedTenant ? getTenantPayments(data, selectedTenant.id) : [];
  const requests = selectedTenant ? getTenantRequests(data, selectedTenant.id) : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <CardTitle>Tenant directory</CardTitle>
          <CardDescription>Search by person, property, or contact info. Message threads are one tap away.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tenants"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredTenants.map((tenant) => {
              const tenantProperty = data.properties.find((entry) => entry.id === tenant.propertyId);
              const unpaidBalance = data.payments
                .filter((payment) => payment.tenantId === tenant.id && payment.status !== "paid")
                .reduce((sum, payment) => sum + centsToDollars(getOutstandingAmountCents(payment)), 0);

              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => setSelectedTenantId(tenant.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedTenant?.id === tenant.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-background/70 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenantProperty?.address} {tenantProperty?.unitLabel}
                      </p>
                    </div>
                    {unpaidBalance > 0 ? <Badge variant="warning">{formatCurrency(unpaidBalance)} due</Badge> : <Badge variant="success">Current</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/75">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{selectedTenant?.name ?? "Select a tenant"}</CardTitle>
              <CardDescription>{selectedTenant?.leaseLabel ?? "Pick a tenant to inspect their full detail panel."}</CardDescription>
            </div>
            {selectedTenant ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedConversationTenantId(selectedTenant.id);
                  router.push("/messages");
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTenant ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard icon={Mail} label="Email" value={selectedTenant.email} />
                <InfoCard icon={Phone} label="Phone" value={selectedTenant.phone} />
              </div>

              <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="h-4 w-4" />
                  Property
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {property?.address} {property?.unitLabel}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{selectedTenant.notes}</p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Payment history</p>
                    <Badge variant="secondary">{payments.length}</Badge>
                  </div>
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {formatCurrency(
                              centsToDollars(
                                payment.status === "paid" ? getCollectedAmountCents(payment) : getOutstandingAmountCents(payment),
                              ),
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatLongDate(payment.dueDate)}</p>
                        </div>
                        <Badge variant={getPaymentStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Maintenance history</p>
                    <Badge variant="secondary">{requests.length}</Badge>
                  </div>
                  {requests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{request.title}</p>
                        <Badge variant={request.status === "done" ? "success" : request.priority === "high" ? "warning" : "secondary"}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{request.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
