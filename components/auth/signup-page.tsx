"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, KeyRound, UserPlus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Role } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const roleConfig: Record<Role, { title: string; subtitle: string; eyebrow: string; icon: typeof Building2 }> = {
  landlord: {
    title: "Create your landlord account",
    subtitle: "Set up your portfolio in minutes: add properties, review applications, collect rent, and message tenants.",
    eyebrow: "Professional Landlord Portal",
    icon: Building2,
  },
  tenant: {
    title: "Create your tenant account",
    subtitle:
      "Sign up with the email on your lease and your home connects automatically. Browse listings and apply in-app.",
    eyebrow: "Resident Tenant Portal",
    icon: UserRound,
  },
};

export function SignupPage({ role = "landlord" }: { role?: Role }) {
  const router = useRouter();
  const signup = useAppStore((state) => state.signup);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentUser = useAppStore((state) => state.currentUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (hasHydrated && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, hasHydrated, router]);

  const config = roleConfig[role];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    try {
      const result = await signup(role, { name, email, password, phone });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message, { duration: 8000 });
      const { currentUser: signedInUser } = useAppStore.getState();
      router.push(signedInUser ? "/dashboard" : "/login");
    } finally {
      setIsPending(false);
    }
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
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>

        <Card className="border-primary/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Get started free</CardTitle>
            <CardDescription>
              {role === "landlord"
                ? "Free includes 2 properties and 10 landlord messages. Upgrade anytime."
                : "Free for tenants, always."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Hale" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={role === "tenant" ? "the email on your lease" : "you@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" size="lg" disabled={isPending}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
