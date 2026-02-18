import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Répondre à l'invitation - Glyms",
    description: "Répondez à l'invitation à un événement d'entreprise sur Glyms. Indiquez vos disponibilités, préférences et disponibilités pour participer aux activités de team building.",
  };
}

export default function AnswerEventLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
