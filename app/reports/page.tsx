import { LandlordReports } from "@/components/app/landlord-reports";
import { ProtectedPage } from "@/components/app/protected-page";

export default function ReportsPage() {
  return (
    <ProtectedPage
      roles={["landlord"]}
      title="Reports"
      description="Cashflow, export hooks, and the premium reporting surface that makes the upgrade story obvious."
    >
      <LandlordReports />
    </ProtectedPage>
  );
}
