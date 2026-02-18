import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Urbanist, Poppins } from 'next/font/google';
import "./globals.css";
import AppShell from "@/app/AppShell";
import DecorationImage from "@/components/ui/DecorationImage";

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://glyms.app'),
  title: {
    default: "Glyms App",
    template: "%s - Glyms",
  },
  description: "Glyms facilite la création et gestion d'événements d'entreprise comme les team buildings. Avec Glyms, les collaborateurs sont au cœur du jeu ! Service proposant une solution en fonction des envies et des disponibilités de chacun des collaborateurs d'une entreprise. L'objectif est de personnaliser les activités du CE d'entreprise en fonction des employés.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${poppins.variable} ${urbanist.variable} antialiased bg-red-500`}>
        <AppShell>
          <div className="relative">
            {children}
            <DecorationImage />
          </div>
        </AppShell>
      </body>
    </html>
  );
}