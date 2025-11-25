"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [is404, setIs404] = useState(false);
  
  useEffect(() => {
    // Détecter si c'est une page 404 en vérifiant la classe sur le body
    const check404 = () => {
      setIs404(document.body.classList.contains("page-404"));
    };
    
    check404();
    const observer = new MutationObserver(check404);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    
    return () => observer.disconnect();
  }, []);
  
  const showHeader = !hideHeaderRoutes.includes(pathname) && !is404;

  return (
    <UserProvider>
      {showHeader && <Header />}
      <FeedbackProvider>
        {children}
      </FeedbackProvider>
    </UserProvider>
  );
}