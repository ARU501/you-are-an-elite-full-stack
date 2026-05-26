"use client";

import { useAppStore } from "@/store/app-store";
import { ProtectedPage } from "@/components/app/protected-page";
import { LandlordDashboard } from "@/components/app/landlord-dashboard";

export function DashboardPageClient() {
  return (
    <ProtectedPage
      roles={["landlord"]}
      title="Landlord Dashboard"
      description="Complete control over your properties, tenants, maintenance, finances, and communications."
    >
      <LandlordDashboard />
    </ProtectedPage>
  );
}
