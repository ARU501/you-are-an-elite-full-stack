import Link from "next/link";
import { ArrowRight, Building2, Home, MessageSquareMore, ShieldCheck, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-semibold">
            LandlordForge
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Demo-ready
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_1fr] lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Landlord SaaS with a real tenant portal
            </div>
            <div className="space-y-5">
              <h1 className="font-heading text-5xl font-semibold leading-tight text-balance sm:text-6xl">
                Landlord ops that finally feel <span className="text-gradient">worth $19/mo</span>.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Show off a premium landlord dashboard, role-based tenant portal, and sticky in-app messaging center from day one.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Role-based login</span>
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Tenant inbox</span>
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Reports paywall</span>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>I&apos;m a Landlord</CardTitle>
                    <CardDescription>Portfolio, rent tracking, maintenance, expenses, reports, and tenant messaging.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-background/70 p-4 text-sm">
                  <p className="text-muted-foreground">Demo credentials</p>
                  <p className="mt-2 font-medium">landlord@demo.com</p>
                  <p className="font-medium">demo123</p>
                </div>
                <Button asChild size="lg" className="w-full">
                  <Link href="/login/landlord">
                    Continue as landlord
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>I&apos;m a Tenant</CardTitle>
                    <CardDescription>My home, payments, maintenance requests, and direct messages to the landlord.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-background/70 p-4 text-sm">
                  <p className="text-muted-foreground">Demo credentials</p>
                  <p className="mt-2 font-medium">tenant@demo.com</p>
                  <p className="font-medium">demo123</p>
                </div>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href="/login/tenant">
                    Continue as tenant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={MessageSquareMore}
            title="Messaging that sticks"
            description="Unread badges, live conversation previews, and a premium broadcast upsell right in the inbox."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Role-safe by default"
            description="Landlords see the whole portfolio. Tenants only see their home, their payments, and their requests."
          />
          <FeatureCard
            icon={Sparkles}
            title="Built to demo well"
            description="Seeded properties, living activity, and enough tenant traffic that the product already feels staffed."
          />
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
