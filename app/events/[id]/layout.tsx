import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Détails de l'événement - Glyms",
    description: "Consultez les détails complets de votre événement d'entreprise sur Glyms : informations, participants, documents et préférences. Gérez et participez aux activités de team building.",
  };
}

export default function EventDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
