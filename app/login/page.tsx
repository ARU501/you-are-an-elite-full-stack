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
'use client';

import { useState } from 'react';
import { TwoFactorVerify } from '@/components/auth/two-factor-verify';

export default function LoginPage() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      // Verify credentials with your backend
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const user = await response.json();

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        setTempUserId(user.id);
        setShowTwoFactor(true); // Show 2FA component
        return;
      }

      // Complete login if no 2FA
      completeLogin(user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleTwoFactorVerified = () => {
    // Complete login after 2FA verification
    completeLogin(tempUserId);
    setShowTwoFactor(false);
  };

  // Show 2FA component if needed
  if (showTwoFactor) {
    return (
      <TwoFactorVerify
        onVerified={handleTwoFactorVerified}
        onCancel={() => setShowTwoFactor(false)}
      />
    );
  }

  // Your existing login form
  return (
    <div>
      <h1>Login</h1>
      {/* Your login form here */}
    </div>
  );
}
