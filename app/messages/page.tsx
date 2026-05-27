import { MessagesCenter } from "@/components/app/messages-center";
import { ProtectedPage } from "@/components/app/protected-page";

export default function MessagesPage() {
  return (
    <ProtectedPage
      roles={["tenant"]}
      title="Messages"
      description="Direct chat with your landlord that survives refreshes for the demo."
    >
      <MessagesCenter />
    </ProtectedPage>
  );
}
