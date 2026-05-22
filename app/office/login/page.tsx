"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OfficeLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/office/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "Identifiants invalides" }));
        setError(data.message || "Identifiants invalides");
        return;
      }

      router.push("/office/tags");
      router.refresh();
    } catch {
      setError("Impossible de se connecter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">Office Login</h1>
        <p className="text-sm text-gray-600 mb-6">
          Espace backoffice réservé aux développeurs.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="office-username" className="block text-sm font-medium mb-1">
              Pseudo
            </label>
            <input
              id="office-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border rounded px-3 py-2"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="office-password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="office-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border rounded px-3 py-2"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}
