"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { Role } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type RoleText = Partial<Record<Role, string>> | string;

interface ProtectedPageProps {
  roles: Role[];
  title: RoleText;
  description: RoleText;
  children: React.ReactNode;
}

function resolveRoleText(value: RoleText, role: Role) {
  return typeof value === "string" ? value : value[role] ?? "";
}

export function ProtectedPage({ roles, title, description, children }: ProtectedPageProps) {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentUser = useAppStore((state) => state.currentUser);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!currentUser) {
      router.replace("/");
      return;
    }

    if (!roles.includes(currentUser.role)) {
      router.replace("/dashboard");
    }
  }, [currentUser, hasHydrated, roles, router]);

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
    <AppShell
      title={resolveRoleText(title, currentUser.role)}
      description={resolveRoleText(description, currentUser.role)}
    >
      {children}
    </AppShell>
  );
}
