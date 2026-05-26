import Link from "next/link";
import { ArrowRight, CreditCard, Home, MessageSquareMore, ShieldCheck, Sparkles, Wrench } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-background via-background to-emerald-50/30 dark:to-emerald-950/10">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
            LandlordForge
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex border-emerald-300 text-emerald-700 dark:border-emerald-800">
              Tenant Portal • Demo
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Your home, simplified
            </div>
            <div className="space-y-5">
              <h1 className="font-heading text-5xl font-semibold leading-tight text-balance tracking-tighter sm:text-6xl lg:text-7xl">
                Everything about your rental <span className="text-emerald-600 dark:text-emerald-400">in one calm place</span>.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Pay rent, track your lease, submit maintenance requests, message your landlord, and browse new homes — 
                beautifully designed and instantly demoable.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-700">
                <Link href="/login/tenant">
                  Enter Tenant Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link href="#features">Explore features</Link>
              </Button>
            </div>

            <div className="pt-2 text-sm text-muted-foreground">
              Pre-loaded with your demo lease • Instant login • No account needed
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-emerald-200 shadow-xl dark:border-emerald-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Tenant Demo</CardTitle>
                    <CardDescription className="text-base">Your complete renter experience, ready instantly.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-muted/50 p-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Demo email</div>
                    <div className="font-semibold mt-1">tenant@demo.com</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Password</div>
                    <div className="font-semibold mt-1">demo123</div>
                  </div>
                </div>
                <Button asChild size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/login/tenant">
                    Open My Tenant Portal
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">Seamless demo • All actions saved locally</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border bg-card p-3">
                <div className="text-2xl font-semibold text-emerald-600">1</div>
                <div className="text-xs text-muted-foreground mt-0.5">Active Lease</div>
              </div>
              <div className="rounded-2xl border bg-card p-3">
                <div className="text-2xl font-semibold text-emerald-600">$1,650</div>
                <div className="text-xs text-muted-foreground mt-0.5">Monthly Rent</div>
              </div>
              <div className="rounded-2xl border bg-card p-3">
                <div className="text-2xl font-semibold text-emerald-600">Aug 31</div>
                <div className="text-xs text-muted-foreground mt-0.5">Lease End</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="pt-8">
          <div className="mb-6 text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">Made for renters who want clarity</h2>
            <p className="text-muted-foreground mt-2">Pay, request, message, and explore — without the usual rental headaches.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={CreditCard}
              title="Rent &amp; Payments"
              description="See what you owe, pay instantly, set up autopay, and view your full payment history."
            />
            <FeatureCard
              icon={Wrench}
              title="Maintenance Requests"
              description="Submit requests with photos and priority. Track status and landlord responses in real time."
            />
            <FeatureCard
              icon={MessageSquareMore}
              title="Direct Messaging"
              description="Chat with your landlord anytime. Messages are persistent and easy to reference."
            />
            <FeatureCard
              icon={Home}
              title="Browse &amp; Apply"
              description="Explore available units and submit rental applications directly from the portal."
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
