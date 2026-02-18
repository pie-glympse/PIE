import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Accueil - Glyms",
  description: "Découvrez vos événements d'entreprise à venir, consultez votre calendrier et gérez vos activités de team building avec Glyms. La plateforme qui met les collaborateurs au cœur de l'organisation des événements.",
};

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
