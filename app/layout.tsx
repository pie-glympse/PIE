import type { Metadata } from "next";
import { Urbanist, Poppins } from 'next/font/google'
import "./globals.css";
import AppShell from "@/app/AppShell";

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
  title: "Glyms App",
  description: "Glyms facilite la création et gestion d'événements d'entreprise comme les team buildings. Avec Glyms, les collaborateurs sont au cœur du jeu ! Service proposant une solution en fonction des envies et des disponibilités de chacun des collaborateurs d'une entreprise. L'objectif est de personnaliser les activités du CE d'entreprise en fonction des employés.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${poppins.variable} ${urbanist.variable} antialiased bg-red-500`}>
        <AppShell>
          <div className="h-screen">
            {children}
          </div>

        </AppShell>
      </body>
    </html>
  );
}