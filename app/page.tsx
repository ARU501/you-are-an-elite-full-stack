import Link from "next/link";
import { ArrowRight, Building2, CreditCard, MessageSquareMore, ShieldCheck, Sparkles, Users, Wrench } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
            LandlordForge
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex border-primary/30">
              Landlord Portal
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              Professional landlord operating system
            </div>
            <div className="space-y-5">
              <h1 className="font-heading text-5xl font-semibold leading-tight text-balance tracking-tighter sm:text-6xl lg:text-7xl">
                Run your rental portfolio with <span className="text-primary">clarity and control</span>.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                A complete landlord workspace with property management, tenant oversight, maintenance, rent collection,
                financial reports, and direct messaging — backed by a real database, live sync, and Stripe-ready
                payments.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/signup">
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>

            <div className="pt-2 text-sm text-muted-foreground">
              Free plan includes 2 properties and tenant messaging • No credit card required
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/20 bg-card shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Landlord Portal</CardTitle>
                    <CardDescription className="text-base">
                      Everything you need to manage rentals professionally.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 rounded-2xl border bg-muted/50 p-4 text-sm">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Real accounts with row-level security per landlord
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Rent charges generated monthly, Stripe collection ready
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquareMore className="h-4 w-4 text-primary" />
                    Live-synced messaging with the matching Tenant Portal
                  </li>
                </ul>
                <Button asChild size="lg" className="w-full">
                  <Link href="/login">
                    Enter the Landlord Portal
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Tenants use the separate Tenant Portal app with the same account system.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="pt-8">
          <div className="mb-6 text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">Built for serious landlords</h2>
            <p className="text-muted-foreground mt-2">Every tool you actually use day-to-day, polished and production-ready.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Building2}
              title="Property Management"
              description="Add, edit, and track every unit. See occupancy, rent roll, and tenant details at a glance."
            />
            <FeatureCard
              icon={Users}
              title="Tenant Oversight"
              description="Full tenant directory with lease info, payment history, requests, and one-click messaging."
            />
            <FeatureCard
              icon={Wrench}
              title="Maintenance Hub"
              description="View, prioritize, and resolve tenant requests. Full audit trail and status updates."
            />
            <FeatureCard
              icon={MessageSquareMore}
              title="Messaging Center"
              description="Threaded conversations per tenant plus Pro broadcast to your entire portfolio."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof MessageSquareMore;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-white/60 bg-white/75 dark:border-white/10 dark:bg-card/70">
      <CardContent className="space-y-4 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
