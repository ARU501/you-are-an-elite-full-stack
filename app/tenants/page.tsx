import { LandlordTenants } from "@/components/app/landlord-tenants";
import { ProtectedPage } from "@/components/app/protected-page";

export default function TenantsPage() {
  return (
    <ProtectedPage
      roles={["landlord"]}
      title="Tenants"
      description="Searchable tenant records with property context, payment history, request history, and one-tap messaging."
    >
      <LandlordTenants />
    </ProtectedPage>
  );
}
