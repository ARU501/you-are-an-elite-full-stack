"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedPageProps {
  roles: Array<'landlord' | 'tenant'>;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ProtectedPage({ roles, title, description, children }: ProtectedPageProps) {
  const router = useRouter();
  const { user, profile, loading, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role && !roles.includes(role)) {
      // User is logged in but wrong role
      router.replace("/login");
    }
  }, [user, role, roles, router, loading]);

  if (loading || !user || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Preparing your workspace
        </div>
      </main>
    );
  }

  if (role && !roles.includes(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AppShell title={title} description={description}>
      {children}
    </AppShell>
  );
}
