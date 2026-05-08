"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Building2, Hammer, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";

export function LoginForm() {
  const [email, setEmail] = useState("demo@landlordforge.com");
  const [password, setPassword] = useState("demo123");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const login = useAppStore((state) => state.login);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      const result = login(email, password);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Demo session ready.");
      router.push("/dashboard");
    });
  }

  return (
    <Card className="overflow-hidden border-white/60 bg-white/80 shadow-glow dark:border-white/10 dark:bg-card/80">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-heading text-lg font-semibold">
            LandlordForge
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>Landlords</span>
            <Hammer className="h-3.5 w-3.5" />
            <span>Contractors</span>
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Open the demo workspace</CardTitle>
          <CardDescription>
            Use the preset credentials to jump straight into the mobile-first MVP.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-9"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/50 p-3 text-sm text-muted-foreground">
            Demo login: <span className="font-semibold text-foreground">demo@landlordforge.com</span> /{" "}
            <span className="font-semibold text-foreground">demo123</span>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            Enter dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
