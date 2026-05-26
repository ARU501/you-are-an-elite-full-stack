"use client";

import { useState } from "react";
import { ArrowLeft, Home, MapPin, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedPage } from "@/components/app/protected-page";

interface Listing {
  id: string;
  address: string;
  unit: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  available: string;
  description: string;
}

const sampleListings: Listing[] = [
  {
    id: "list-1",
    address: "215 Oak Lane",
    unit: "Apt 4B",
    rent: 1425,
    bedrooms: 1,
    bathrooms: 1,
    available: "July 1",
    description: "Bright one-bedroom with hardwood floors, close to transit and parks.",
  },
  {
    id: "list-2",
    address: "88 River Road",
    unit: "Unit 1",
    rent: 1890,
    bedrooms: 2,
    bathrooms: 1.5,
    available: "June 15",
    description: "Spacious two-bedroom townhome with private patio and in-unit laundry.",
  },
  {
    id: "list-3",
    address: "1421 Maple Street",
    unit: "Unit 3",
    rent: 1650,
    bedrooms: 2,
    bathrooms: 1,
    available: "August 1",
    description: "Recently renovated unit in the same building as your current home.",
  },
];

export default function BrowseAndApplyPage() {
  const [selected, setSelected] = useState<Listing | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleApply(listing: Listing) {
    setSelected(listing);
    setSubmitted(false);
  }

  function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Application submitted!", {
      description: `Your application for ${selected?.address} has been sent to the landlord.`,
    });
  }

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
            <p className="text-muted-foreground mt-1">Current listings from your landlord and partner properties</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Home</Link>
          </Button>
        </div>

        {!selected && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sampleListings.map((listing) => (
              <Card key={listing.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Home className="h-5 w-5 text-emerald-600" /> {listing.address}
                      </CardTitle>
                      <CardDescription>{listing.unit}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950">
                      Available {listing.available}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> <span className="font-semibold">${listing.rent}</span>/mo</div>
                    <div>{listing.bedrooms} bed • {listing.bathrooms} bath</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{listing.description}</p>
                  <Button onClick={() => handleApply(listing)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Apply for this unit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selected && !submitted && (
          <Card className="max-w-2xl mx-auto border-emerald-200">
            <CardHeader>
              <CardTitle>Apply for {selected.address} {selected.unit}</CardTitle>
              <CardDescription>${selected.rent}/month • Available {selected.available}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitApplication} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input defaultValue="Dana Cole" required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" defaultValue="tenant@demo.com" required />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input defaultValue="(555) 220-1930" required />
                  </div>
                  <div>
                    <Label>Desired Move-In</Label>
                    <Input defaultValue={selected.available} required />
                  </div>
                </div>

                <div>
                  <Label>Why are you a great tenant?</Label>
                  <textarea className="w-full rounded-md border p-3 text-sm" rows={3} defaultValue="I pay on time, keep the place clean, and have excellent references from my current landlord." required />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">Submit Application</Button>
                  <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
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
                The landlord has been notified about your interest in {selected.address}. You should hear back within 48 hours.
              </p>
              <Button onClick={() => { setSelected(null); setSubmitted(false); }} className="mt-6" variant="outline">
                Browse more homes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedPage>
  );
}
