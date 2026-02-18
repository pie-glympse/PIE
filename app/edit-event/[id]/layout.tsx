import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Modifier l'événement - Glyms",
    description: "Modifiez les informations de votre événement d'entreprise sur Glyms : dates, heures, lieu et autres détails. Gérez facilement vos activités de team building.",
  };
}

export default function EditEventLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
