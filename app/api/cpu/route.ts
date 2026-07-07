import { NextRequest, NextResponse } from "next/server";

/**
 * Route de charge CPU contrôlée — sert de cible pour les tests k6 / le profiling
 * Pyroscope (fonction volontairement énergivore).
 *
 * Sécurité : en production, l'accès exige un token (`?token=` === CPU_TEST_TOKEN)
 * pour éviter d'exposer un vecteur de déni de service. En dev, l'accès est libre.
 * Durée de calcul paramétrable via `?ms=` (bornée à 10 s).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (process.env.NODE_ENV === "production") {
    const token = searchParams.get("token");
    if (!process.env.CPU_TEST_TOKEN || token !== process.env.CPU_TEST_TOKEN) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const ms = Math.min(Math.max(Number(searchParams.get("ms")) || 2000, 0), 10_000);

  const start = Date.now();
  let sum = 0;
  // Brûle du CPU pendant ~`ms` millisecondes.
  while (Date.now() - start < ms) {
    for (let i = 0; i < 100000; i++) {
      sum += Math.sqrt(i);
    }
  }

  return NextResponse.json({ done: true, ms, elapsed: Date.now() - start, sum });
}
