import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Statistiques - Glyms",
  description: "Consultez les statistiques détaillées de vos événements d'entreprise : taux de participation, satisfaction des participants, tendances et analyses des activités de team building.",
};

export default function StatsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
