import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Créer des groupes - Glyms",
  description: "Organisez vos collaborateurs en équipes sur Glyms. Créez et gérez des groupes pour faciliter l'invitation et la gestion des participants aux événements d'entreprise.",
};

export default function CreateGroupsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
