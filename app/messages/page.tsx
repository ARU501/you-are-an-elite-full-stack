import { MessagesCenter } from "@/components/app/messages-center";
import { ProtectedPage } from "@/components/app/protected-page";

export default function MessagesPage() {
  return (
    <ProtectedPage
      roles={["landlord", "tenant"]}
      title={{ landlord: "Inbox", tenant: "Messages" }}
      description={{
        landlord: "Every tenant thread, unread count, and premium broadcast hook in one fast message center.",
        tenant: "Direct chat with your landlord that survives refreshes for the demo.",
      }}
    >
      <MessagesCenter />
    </ProtectedPage>
  );
}
