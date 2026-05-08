import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CircleDollarSign,
  Hammer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const featureCards = [
  {
    title: "Cashflow at a glance",
    description: "See what is due, what is overdue, and what hit your account this month.",
    icon: CircleDollarSign,
  },
  {
    title: "One workflow, two modes",
    description: "Switch between landlord and contractor operations without swapping tools.",
    icon: Smartphone,
  },
  {
    title: "Reports that upsell themselves",
    description: "Free gets the core workflow. Pro unlocks reports, unlimited records, and predictions.",
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-semibold">
            LandlordForge
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              PWA ready
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Built for small landlords and solo contractors
            </div>
            <div className="space-y-5">
              <h1 className="font-heading text-5xl font-semibold leading-tight text-balance sm:text-6xl">
                The lean ops stack that gets you to <span className="text-gradient">$100k ARR faster</span>.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Track rent, jobs, maintenance, invoices, expenses, and reports in one dead-simple mobile-first app.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <DemoLoginButton size="lg" className="w-full sm:w-auto">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </DemoLoginButton>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/login">Use demo login</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Free</span>
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Pro $19/mo</span>
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                Offline-first
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-accent/15 blur-3xl" />
            <Card className="relative overflow-hidden border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
              <CardHeader className="border-b border-border/60 bg-background/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <CardTitle className="text-2xl">Landlord Mode</CardTitle>
                  </div>
                  <Badge>Free</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                    <p className="text-sm opacity-80">Total Rent Due</p>
                    <p className="mt-3 text-3xl font-semibold">$1,650</p>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">Open Maintenance</p>
                    <p className="mt-3 text-3xl font-semibold">2</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-sm text-muted-foreground">Cashflow this month</p>
                    <p className="mt-3 text-3xl font-semibold">$2,610</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-sm text-muted-foreground">Active properties</p>
                    <p className="mt-3 text-3xl font-semibold">2</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Offline safe by default</p>
                      <p className="text-sm text-muted-foreground">
                        LocalStorage plus IndexedDB keep your dashboard alive on the road.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-warning/20 p-2 text-warning-foreground">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Maple Street rent overdue</p>
                        <p className="text-sm text-muted-foreground">Reminder sent 3h ago</p>
                      </div>
                    </div>
                    <Badge variant="warning">Alert</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Leak inspection queued</p>
                        <p className="text-sm text-muted-foreground">Push notification ready</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Open</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 pb-16 md:grid-cols-3">
          {featureCards.map((feature, index) => (
            <Card
              key={feature.title}
              className="animate-fade-in-up border-white/60 bg-white/75 dark:border-white/10 dark:bg-card/70"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-heading text-xl font-semibold">{feature.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
