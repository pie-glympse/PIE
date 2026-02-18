import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mot de passe oublié - Glyms",
  description: "Réinitialisez votre mot de passe Glyms en toute sécurité. Recevez un lien de récupération par email pour retrouver l'accès à votre compte.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
