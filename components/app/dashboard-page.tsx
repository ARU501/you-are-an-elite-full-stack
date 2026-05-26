"use client";

import { useAppStore } from "@/store/app-store";
import { ProtectedPage } from "@/components/app/protected-page";
import { TenantHome } from "@/components/app/tenant-home";

export function DashboardPageClient() {
  return (
    <ProtectedPage
      roles={["tenant"]}
      title="My Home"
      description="Your lease, rent, maintenance requests, payments, and direct messaging with your landlord."
    >
      <TenantHome />
    </ProtectedPage>
  );
}
