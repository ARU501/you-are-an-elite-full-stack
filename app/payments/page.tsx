import { ProtectedPage } from "@/components/app/protected-page";
import { TenantPayments } from "@/components/app/tenant-payments";

export default function PaymentsPage() {
  return (
    <ProtectedPage
      roles={["tenant"]}
      title="Payments"
      description="Track rent status and use the demo pay action to simulate a real tenant payment flow."
    >
      <TenantPayments />
    </ProtectedPage>
  );
}
