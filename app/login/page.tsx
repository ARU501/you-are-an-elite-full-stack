import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginChooserPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between pb-6">
        <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
          LandlordForge
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-lg">
        <Card className="border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl">Landlord Portal</CardTitle>
            <CardDescription className="text-base pt-2">Sign in to manage your full portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button asChild size="lg" className="w-full h-12 text-base">
              <Link href="/login/landlord">
                Enter Landlord Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Instant access with realistic demo data. All changes persist locally.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
