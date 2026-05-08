"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { useAppStore } from "@/store/app-store";

export function DashboardClient() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const isAuthenticated = useAppStore((state) => state.user.isAuthenticated);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Preparing your workspace
        </div>
      </main>
    );
  }

  return <AppShell />;
}
