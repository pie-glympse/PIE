import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mes événements - Glyms",
  description: "Consultez tous vos événements d'entreprise sur Glyms : événements à venir, passés, en préparation. Gérez vos invitations, préférences et participations aux activités de team building.",
};

export default function EventsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
