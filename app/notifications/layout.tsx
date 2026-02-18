import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Notifications - Glyms",
  description: "Consultez toutes vos notifications Glyms : invitations aux événements, retours des participants, mises à jour et alertes importantes concernant vos activités d'entreprise.",
};

export default function NotificationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
