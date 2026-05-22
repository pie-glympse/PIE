import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Paramètres - Glyms",
  description: "Gérez vos paramètres de compte, préférences et options de sécurité.",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
