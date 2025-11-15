"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { UserProvider, useUser } from "../context/UserContext";
import FeedbackModal from "@/components/FeedbackModal";
import { useFeedbackNotification } from "@/hooks/useFeedbackNotification";

const hideHeaderRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/first-connection"];

function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { pendingFeedback, clearPendingFeedback } = useFeedbackNotification();

  return (
    <>
      {children}
      {pendingFeedback && user && (
        <FeedbackModal
          isOpen={true}
          onClose={clearPendingFeedback}
          eventId={pendingFeedback.eventId}
          eventTitle={pendingFeedback.eventTitle || "Événement"}
          userId={user.id}
          notificationId={pendingFeedback.id}
        />
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !hideHeaderRoutes.includes(pathname);

  return (
    <UserProvider>
      {showHeader && <Header />}
      <FeedbackProvider>
        {children}
      </FeedbackProvider>
    </UserProvider>
  );
}