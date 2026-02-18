import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe - Glyms",
  description: "Réinitialisez votre mot de passe Glyms avec un nouveau mot de passe sécurisé pour retrouver l'accès à votre compte et à vos événements.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
