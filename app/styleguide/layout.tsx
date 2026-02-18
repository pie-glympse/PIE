import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Guide de style - Glyms",
  description: "Consultez le guide de style Glyms : références visuelles, typographie, couleurs et composants de la plateforme de gestion d'événements d'entreprise.",
};

export default function StyleguideLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
