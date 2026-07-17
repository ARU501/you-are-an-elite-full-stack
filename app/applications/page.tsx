"use client";

import { useState } from "react";
import { ArrowLeft, Check, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedPage } from "@/components/app/protected-page";
import { formatCurrency, formatLongDate } from "@/lib/formatters";
import { ApplicationItem } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export default function ApplicationsPage() {
  const applications = useAppStore((state) => state.applications);
  const properties = useAppStore((state) => state.properties);
  const decideApplication = useAppStore((state) => state.decideApplication);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const pending = applications.filter((a) => a.status === "pending");
  const processed = applications.filter((a) => a.status !== "pending");

  function propertyLabel(app: ApplicationItem) {
    const property = properties.find((entry) => entry.id === app.propertyId);
    if (!property) {
      return { address: "Listing removed", unit: "", rent: null as number | null };
    }
    return { address: property.address, unit: property.unitLabel, rent: property.monthlyRent };
  }

  async function handleDecision(app: ApplicationItem, decision: "approved" | "declined") {
    setDecidingId(app.id);
    try {
      const result = await decideApplication(app.id, decision);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (decision === "approved") {
        toast.success(`${app.name} approved`, {
          description: result.message,
          action: {
            label: "View Tenants",
            onClick: () => (window.location.href = "/tenants"),
          },
        });
      } else {
        toast.info(`Application from ${app.name} declined`);
      }
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <ProtectedPage
      roles={["landlord"]}
      title="Rental Applications"
      description="Review and approve new tenants. Approved applicants are instantly added to your active tenant roster."
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">Rental Applications</h2>
            <p className="text-muted-foreground mt-1"> {pending.length} new applications waiting for review</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {pending.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {pending.map((app) => {
              const property = propertyLabel(app);
              return (
                <Card key={app.id} className="border-primary/20 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{app.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {app.email}
                          {app.phone ? ` • ${app.phone}` : ""}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                      >
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Target Property</div>
                        <div className="font-medium mt-0.5">
                          {property.address}{" "}
                          {property.unit ? <span className="text-muted-foreground">({property.unit})</span> : null}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Requested Move-In</div>
                        <div className="font-medium mt-0.5">{app.moveIn || "Flexible"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Monthly Rent</div>
                        <div className="font-medium mt-0.5">
                          {property.rent !== null ? formatCurrency(property.rent) : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Stated Income</div>
                        <div className="font-medium mt-0.5">{app.income || "Not provided"}</div>
                      </div>
                    </div>

                    {app.notes ? (
                      <div className="rounded-xl bg-muted/60 p-4 text-sm">
                        <div className="font-medium mb-1 text-xs tracking-widest text-muted-foreground">
                          APPLICANT NOTES
                        </div>
                        {app.notes}
                      </div>
                    ) : null}

                    <p className="text-xs text-muted-foreground">Applied {formatLongDate(app.createdAt)}</p>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleDecision(app, "approved")}
                        className="flex-1"
                        size="lg"
                        disabled={decidingId === app.id}
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve &amp; Add Tenant
                      </Button>
                      <Button
                        onClick={() => handleDecision(app, "declined")}
                        variant="outline"
                        size="lg"
                        disabled={decidingId === app.id}
                      >
                        <X className="mr-2 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed py-10">
            <CardContent className="text-center">
              <UserPlus className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No pending applications</p>
              <p className="text-muted-foreground">
                When tenants apply to your vacant listings from the Tenant Portal, they appear here for review.
              </p>
            </CardContent>
          </Card>
        )}

        {processed.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-muted-foreground tracking-wider text-sm">RECENT DECISIONS</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {processed.map((app) => {
                const property = propertyLabel(app);
                return (
                  <div key={app.id} className="rounded-2xl border p-4 text-sm flex flex-col gap-1">
                    <div className="font-medium">{app.name}</div>
                    <div className="text-muted-foreground">{property.address}</div>
                    <Badge variant={app.status === "approved" ? "default" : "destructive"} className="w-fit mt-2">
                      {app.status === "approved" ? "Approved" : "Declined"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
