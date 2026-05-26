"use client";

import { useState } from "react";
import { ArrowLeft, Check, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedPage } from "@/components/app/protected-page";

interface RentalApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  unit: string;
  monthlyRent: number;
  moveIn: string;
  income: string;
  credit: string;
  notes: string;
  status: "pending" | "approved" | "declined";
}

const initialApplications: RentalApplication[] = [
  {
    id: "app-1",
    name: "Jordan Hale",
    email: "jordan.hale@email.com",
    phone: "(555) 441-9021",
    property: "1421 Maple Street",
    unit: "Unit 2",
    monthlyRent: 1650,
    moveIn: "June 15, 2026",
    income: "$78,000 / yr",
    credit: "728",
    notes: "Strong references from previous landlord. Works remotely. Prefers 12-month lease.",
    status: "pending",
  },
  {
    id: "app-2",
    name: "Priya Singh",
    email: "priya.singh@email.com",
    phone: "(555) 309-1184",
    property: "77 Cedar Avenue",
    unit: "Main House",
    monthlyRent: 2100,
    moveIn: "July 1, 2026",
    income: "$94,500 / yr",
    credit: "691",
    notes: "Co-applicant (partner) also employed full-time. Looking for long-term stay.",
    status: "pending",
  },
  {
    id: "app-3",
    name: "Marcus Bell",
    email: "marcus.bell@email.com",
    phone: "(555) 772-3340",
    property: "1421 Maple Street",
    unit: "Unit 2",
    monthlyRent: 1650,
    moveIn: "June 20, 2026",
    income: "$61,200 / yr",
    credit: "654",
    notes: "Recently relocated for new job. Has a small dog (approved pet on previous lease).",
    status: "pending",
  },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<RentalApplication[]>(initialApplications);

  const pending = applications.filter((a) => a.status === "pending");
  const processed = applications.filter((a) => a.status !== "pending");

  function handleApprove(app: RentalApplication) {
    // In a real app this would create tenant + lease + welcome message via store
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: "approved" as const } : a))
    );

    toast.success(`${app.name} approved`, {
      description: `${app.property} ${app.unit} lease can now be prepared. Tenant record created.`,
      action: {
        label: "View Tenants",
        onClick: () => (window.location.href = "/tenants"),
      },
    });
  }

  function handleDecline(app: RentalApplication) {
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: "declined" as const } : a))
    );
    toast.info(`Application from ${app.name} declined`);
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
            {pending.map((app) => (
              <Card key={app.id} className="border-primary/20 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{app.name}</CardTitle>
                      <CardDescription className="mt-1">{app.email} • {app.phone}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Target Property</div>
                      <div className="font-medium mt-0.5">{app.property} <span className="text-muted-foreground">({app.unit})</span></div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Requested Move-In</div>
                      <div className="font-medium mt-0.5">{app.moveIn}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Monthly Rent</div>
                      <div className="font-medium mt-0.5">${app.monthlyRent.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Income / Credit</div>
                      <div className="font-medium mt-0.5">{app.income} • {app.credit}</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-4 text-sm">
                    <div className="font-medium mb-1 text-xs tracking-widest text-muted-foreground">APPLICANT NOTES</div>
                    {app.notes}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => handleApprove(app)} className="flex-1" size="lg">
                      <Check className="mr-2 h-4 w-4" /> Approve &amp; Add Tenant
                    </Button>
                    <Button onClick={() => handleDecline(app)} variant="outline" size="lg">
                      <X className="mr-2 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed py-10">
            <CardContent className="text-center">
              <UserPlus className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No pending applications</p>
              <p className="text-muted-foreground">New rental applications will appear here for quick review.</p>
            </CardContent>
          </Card>
        )}

        {processed.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-muted-foreground tracking-wider text-sm">RECENT DECISIONS</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {processed.map((app) => (
                <div key={app.id} className="rounded-2xl border p-4 text-sm flex flex-col gap-1">
                  <div className="font-medium">{app.name}</div>
                  <div className="text-muted-foreground">{app.property}</div>
                  <Badge variant={app.status === "approved" ? "default" : "destructive"} className="w-fit mt-2">
                    {app.status === "approved" ? "Approved" : "Declined"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
