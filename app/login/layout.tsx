import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Connexion - Glyms",
  description: "Connectez-vous à votre compte Glyms pour accéder à vos événements d'entreprise, gérer vos préférences et participer aux activités de team building.",
};

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
