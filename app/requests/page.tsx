import { ProtectedPage } from "@/components/app/protected-page";
import { TenantRequests } from "@/components/app/tenant-requests";

export default function RequestsPage() {
  return (
    <ProtectedPage
      roles={["tenant"]}
      title="Requests"
      description="Submit maintenance issues, keep the landlord loop tight, and see your own request history only."
    >
      <TenantRequests />
    </ProtectedPage>
  );
}
