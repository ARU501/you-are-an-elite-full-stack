"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { SetupNotice } from "@/components/app/setup-notice";
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
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const supabaseConfigured = useAppStore((state) => state.supabaseConfigured);
  const currentUser = useAppStore((state) => state.currentUser);

  useEffect(() => {
    if (!hasHydrated || !supabaseConfigured) {
      return;
    }

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (!roles.includes(currentUser.role)) {
      router.replace("/dashboard");
    }
  }, [currentUser, hasHydrated, supabaseConfigured, roles, router]);

  if (hasHydrated && !supabaseConfigured) {
    return <SetupNotice />;
  }

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

  const displayTitle = getPageCopy(title, currentUser.role);
  const displayDescription = getPageCopy(description, currentUser.role);

  return (
    <AppShell title={displayTitle} description={displayDescription}>
      {children}
    </AppShell>
  );
}
