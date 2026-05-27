"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, DoorOpen, Home, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { DEMO_CREDENTIALS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";

const roleConfig = {
  tenant: {
    title: "Tenant Login",
    subtitle: "See your lease, pay rent, submit maintenance, message your landlord, and browse new homes — all in one place.",
    eyebrow: "Tenant Portal",
    icon: Home,
    altHref: "/",
    altLabel: "Back to tenant overview",
  },
};

export function RoleLoginPage() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentUser = useAppStore((state) => state.currentUser);
  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS.tenant.email);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.tenant.password);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (hasHydrated && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, hasHydrated, router]);

  const config = roleConfig.tenant;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      const result = login("tenant", email, password);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Welcome back to your home.");
      router.push("/dashboard");
    });
  }

  return (
    <main className="surface-grid min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between pb-6">
        <Link href="/" className="font-heading text-xl font-semibold">
          LandlordForge
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
            <config.icon className="h-4 w-4 text-primary" />
            {config.eyebrow}
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-5xl font-semibold leading-tight text-balance">{config.title}</h1>
            <p className="max-w-xl text-lg text-muted-foreground">{config.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Demo email</p>
              <p className="mt-2 font-medium">{DEMO_CREDENTIALS.tenant.email}</p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Demo password</p>
              <p className="mt-2 font-medium">{DEMO_CREDENTIALS.tenant.password}</p>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription>Use the preloaded demo account or swap credentials once a backend exists.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="tenant-email">Email</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-password">Password</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="tenant-password"
                    type="password"
                    className="pl-9"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                <DoorOpen className="h-4 w-4" />
                Enter demo
              </Button>
            </form>

            <div className="mt-5 rounded-3xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              Want the full tenant overview?{" "}
              <Link href={config.altHref} className="font-medium text-foreground">
                {config.altLabel}
              </Link>
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
