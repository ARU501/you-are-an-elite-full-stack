import { LandlordProperties } from "@/components/app/landlord-properties";
import { ProtectedPage } from "@/components/app/protected-page";

export default function PropertiesPage() {
  return (
    <ProtectedPage
      roles={["landlord"]}
      title="Properties"
      description="Portfolio-level rent visibility, expenses, and maintenance pressure tied to the right home."
    >
      <LandlordProperties />
    </ProtectedPage>
  );
}
