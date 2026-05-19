import { ProtectedPage } from "@/components/app/protected-page";
import { TenantPayments } from "@/components/app/tenant-payments";

export default function PaymentsPage() {
  return (
    <ProtectedPage
      roles={["tenant"]}
      title="Payments"
      description="Use the Stripe-ready payment portal, manage autopay preferences, and keep the landlord loop updated."
    >
      <TenantPayments />
    </ProtectedPage>
  );
}
