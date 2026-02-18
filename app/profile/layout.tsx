import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mon profil - Glyms",
  description: "Gérez votre profil utilisateur Glyms : modifiez vos informations personnelles, votre photo de profil, et consultez vos préférences pour les événements d'entreprise.",
};

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
