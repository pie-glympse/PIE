import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contactez-nous - Glyms",
  description: "Contactez l'équipe Glyms pour toute question, demande d'assistance ou suggestion concernant la plateforme de gestion d'événements d'entreprise. Nous sommes là pour vous aider.",
};

export default function ContactUsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
