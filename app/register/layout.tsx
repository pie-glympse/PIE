import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Inscription - Glyms",
  description: "Inscrivez votre équipe sur Glyms et créez votre espace entreprise. Gérez facilement les événements de team building et impliquez tous vos collaborateurs dans l'organisation des activités.",
};

export default function RegisterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
