'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext"; // adapte le chemin si nécessaire

export default function LoginForm() {
  const { setUser, setToken } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erreur de connexion");
        return;
      }

      setToken(data.token);
      setUser(data.user);

      // Optionnel mais utile pour persistance
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/events"); // ou autre redirection post-login
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur serveur");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-10">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2"
        required
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2"
        required
      />

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Se connecter
      </button>
    </form>
  );
}
