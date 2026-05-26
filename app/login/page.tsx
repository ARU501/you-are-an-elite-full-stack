import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginChooserPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-emerald-50/20 dark:to-emerald-950/10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between pb-6">
        <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
          LandlordForge
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-md">
        <Card className="border-emerald-200 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
              <Home className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Tenant Portal</CardTitle>
            <CardDescription className="text-base">Pay rent, request repairs, message your landlord, and browse homes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Button asChild size="lg" className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login/tenant">
                Enter Tenant Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Instant access • All changes saved in your browser
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

