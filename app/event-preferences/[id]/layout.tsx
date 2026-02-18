import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Préférences de l'événement - Glyms",
    description: "Indiquez vos préférences pour cet événement d'entreprise sur Glyms : choix d'activités, disponibilités et options personnalisées pour personnaliser votre expérience de team building.",
  };
}

export default function EventPreferencesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
