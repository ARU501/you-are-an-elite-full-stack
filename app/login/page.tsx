import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginChooserPage() {
  return (
    <main className="surface-grid min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between pb-6">
        <Link href="/" className="font-heading text-xl font-semibold">
          LandlordForge
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        <Card className="border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
          <CardHeader>
            <CardTitle>Landlord login</CardTitle>
            <CardDescription>Portfolio, tenants, requests, messages, and reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login/landlord">Continue as landlord</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
          <CardHeader>
            <CardTitle>Tenant login</CardTitle>
            <CardDescription>My home, payments, requests, and direct landlord messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/login/tenant">Continue as tenant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
