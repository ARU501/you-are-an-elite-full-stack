"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, DollarSign, Home, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedPage } from "@/components/app/protected-page";
import { formatCurrency } from "@/lib/formatters";
import { ListingItem } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export default function BrowseAndApplyPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const listings = useAppStore((state) => state.listings);
  const applications = useAppStore((state) => state.applications);
  const fetchListings = useAppStore((state) => state.fetchListings);
  const submitApplication = useAppStore((state) => state.submitApplication);

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ListingItem | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [income, setIncome] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setName((prev) => prev || currentUser.name);
    setEmail((prev) => prev || currentUser.email);

    let cancelled = false;
    void fetchListings().then((result) => {
      if (!cancelled) {
        if (!result.ok) {
          toast.error(result.message);
        }
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser, fetchListings]);

  function handleApply(listing: ListingItem) {
    setSelected(listing);
    setSubmitted(false);
  }

  async function handleSubmitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitApplication({
        propertyId: selected.id,
        name,
        email,
        phone,
        moveIn,
        income,
        notes,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setSubmitted(true);
      toast.success("Application submitted!", {
        description: `Your application for ${selected.address} has been sent to the landlord.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const pendingApplicationPropertyIds = new Set(
    applications.filter((app) => app.status === "pending").map((app) => app.propertyId),
  );

  return (
    <ProtectedPage
      roles={["tenant"]}
      title="Browse Available Homes"
      description="Find your next place. Submit applications directly through the portal."
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">Available Rentals</h2>
            <p className="text-muted-foreground mt-1">Live listings from landlords on LandlordForge</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Home</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading available homes
          </div>
        ) : null}

        {!loading && !selected && listings.length === 0 ? (
          <Card className="border-dashed py-10">
            <CardContent className="text-center">
              <Home className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No homes listed right now</p>
              <p className="text-muted-foreground">
                When a landlord marks a unit vacant, it shows up here instantly. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!loading && !selected && listings.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const alreadyApplied = pendingApplicationPropertyIds.has(listing.id);
              return (
                <Card key={listing.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Home className="h-5 w-5 text-emerald-600" /> {listing.address}
                        </CardTitle>
                        <CardDescription>{listing.unitLabel || "Whole unit"}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950">
                        Available now
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{formatCurrency(listing.monthlyRent)}</span>/mo
                    </div>
                    {listing.description ? (
                      <p className="text-sm text-muted-foreground">{listing.description}</p>
                    ) : null}
                    <Button
                      onClick={() => handleApply(listing)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={alreadyApplied}
                    >
                      {alreadyApplied ? "Application pending" : "Apply for this unit"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selected && !submitted && (
          <Card className="max-w-2xl mx-auto border-emerald-200">
            <CardHeader>
              <CardTitle>
                Apply for {selected.address} {selected.unitLabel}
              </CardTitle>
              <CardDescription>{formatCurrency(selected.monthlyRent)}/month</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitApplication} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0100" />
                  </div>
                  <div>
                    <Label>Desired Move-In</Label>
                    <Input value={moveIn} onChange={(e) => setMoveIn(e.target.value)} placeholder="August 1" required />
                  </div>
                </div>

                <div>
                  <Label>Annual income</Label>
                  <Input value={income} onChange={(e) => setIncome(e.target.value)} placeholder="$65,000 / yr" />
                </div>

                <div>
                  <Label>Why are you a great tenant?</Label>
                  <textarea
                    className="w-full rounded-md border p-3 text-sm"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="References, work situation, anything the landlord should know."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                    {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {submitting ? "Submitting" : "Submit Application"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelected(null)} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {submitted && selected && (
          <Card className="max-w-md mx-auto text-center py-10 border-emerald-200">
            <CardContent>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Application Received!</h3>
              <p className="mt-2 text-muted-foreground">
                The landlord has been notified about your interest in {selected.address}. If they approve, your new
                home appears in this portal automatically.
              </p>
              <Button
                onClick={() => {
                  setSelected(null);
                  setSubmitted(false);
                }}
                className="mt-6"
                variant="outline"
              >
                Browse more homes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedPage>
  );
}
