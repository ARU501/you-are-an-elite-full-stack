"use client";

import { useAppStore } from "@/store/app-store";
import { ProtectedPage } from "@/components/app/protected-page";
import { LandlordDashboard } from "@/components/app/landlord-dashboard";
import { TenantHome } from "@/components/app/tenant-home";

export function DashboardPageClient() {
  const currentUser = useAppStore((state) => state.currentUser);

  return (
    <ProtectedPage
      roles={["landlord", "tenant"]}
      title={{ landlord: "Landlord dashboard", tenant: "My home" }}
      description={{
        landlord: "Watch rent, maintenance, tenant messaging, expenses, and upgrades from one calm operating screen.",
        tenant: "Pay rent, submit requests, and keep your landlord thread in one clean portal.",
      }}
    >
      {currentUser?.role === "tenant" ? <TenantHome /> : <LandlordDashboard />}
    </ProtectedPage>
  );
}
