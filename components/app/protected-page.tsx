"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Role } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type PageCopy = string | Record<Role, string>;

interface ProtectedPageProps {
  roles: Role[];
  title: PageCopy;
  description: PageCopy;
  children: React.ReactNode;
}

function getPageCopy(copy: PageCopy, role: Role) {
  return typeof copy === "string" ? copy : copy[role];
}

export function ProtectedPage({ roles, title, description, children }: ProtectedPageProps) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentUser = useAppStore((state) => state.currentUser);
  const enterDemo = useAppStore((state) => state.enterDemo);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!currentUser || !roles.includes(currentUser.role)) {
      // Seamless tenant demo: recover from empty or sibling-branch sessions.
      enterDemo();
    }
  }, [currentUser, hasHydrated, roles, enterDemo]);

  if (!hasHydrated || !currentUser || !roles.includes(currentUser.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Preparing your workspace
        </div>
      </main>
    );
  }

  return (
    <AppShell title={getPageCopy(title, currentUser.role)} description={getPageCopy(description, currentUser.role)}>
      {children}
    </AppShell>
  );
}
