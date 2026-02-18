import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Créer un événement - Glyms",
  description: "Créez un nouvel événement d'entreprise sur Glyms : définissez le type d'activité, les dates, le lieu, invitez vos collaborateurs et personnalisez votre événement de team building.",
};

export default function CreateEventLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
