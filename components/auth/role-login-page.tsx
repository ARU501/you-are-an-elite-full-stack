"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Building2, DoorOpen, KeyRound, Sparkles } from "lucide-react";
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
  landlord: {
    title: "Landlord Login",
    subtitle: "Access your complete property portfolio, tenant oversight, maintenance queue, financial reports, and messaging center.",
    eyebrow: "Professional Landlord Portal",
    icon: Building2,
  },
};

export function RoleLoginPage() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentUser = useAppStore((state) => state.currentUser);
  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS.landlord.email);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.landlord.password);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (hasHydrated && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, hasHydrated, router]);

  const config = roleConfig.landlord;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      const result = login("landlord", email, password);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Welcome back, Morgan. Your portfolio is ready.");
      router.push("/dashboard");
    });
  }

  // Quick demo entry - auto login with one click for the best demo experience
  function quickDemoEntry() {
    startTransition(() => {
      const result = login("landlord", DEMO_CREDENTIALS.landlord.email, DEMO_CREDENTIALS.landlord.password);
      if (result.ok) {
        toast.success("Demo session started instantly.");
        router.push("/dashboard");
      }
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between pb-8">
        <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
          LandlordForge
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <config.icon className="h-4 w-4" />
            {config.eyebrow}
          </div>
          <h1 className="font-heading text-5xl font-semibold tracking-tighter leading-tight">{config.title}</h1>
          <p className="text-xl text-muted-foreground max-w-md">{config.subtitle}</p>

          <div className="pt-4">
            <Button onClick={quickDemoEntry} size="lg" className="w-full sm:w-auto h-12 text-base" disabled={isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              Enter Demo Instantly
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">No typing needed — full portfolio pre-loaded with sample data.</p>
          </div>
        </div>

        <Card className="border-primary/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to your workspace</CardTitle>
            <CardDescription>Pre-filled with the landlord demo account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" size="lg" disabled={isPending}>
                <DoorOpen className="h-4 w-4 mr-2" />
                Enter Landlord Portal
              </Button>
            </form>

            <div className="mt-6 rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
              This is a fully functional demo. All actions (adding properties, updating maintenance, messaging tenants, recording payments) persist in your browser.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
