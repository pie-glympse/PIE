import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bienvenue - Glyms",
  description: "Bienvenue sur Glyms, la plateforme qui facilite la création et la gestion d'événements d'entreprise. Découvrez comment personnaliser les activités selon les envies et disponibilités de vos collaborateurs.",
};

export default function GreetingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
