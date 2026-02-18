import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Définir le mot de passe - Glyms",
  description: "Définissez votre mot de passe pour finaliser votre inscription sur Glyms et accéder à tous les événements d'entreprise de votre organisation.",
};

export default function SetPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
