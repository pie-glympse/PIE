"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainButton from "@/components/ui/MainButton";

type Status = "loading" | "success" | "error";

export default function RegisterCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Finalisation de votre inscription...
        </div>
      }
    >
      <RegisterCompleteContent />
    </Suspense>
  );
}

function RegisterCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const finalizeStarted = useRef(false);

  useEffect(() => {
    if (finalizeStarted.current) return;
    finalizeStarted.current = true;

    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("Session de paiement introuvable.");
      return;
    }

    const finalize = async () => {
      try {
        const res = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(
            data.error || "La finalisation de l'inscription a échoué.",
          );
          return;
        }

        setStatus("success");
        setMessage(
          data.alreadyDone
            ? "Votre inscription est déjà finalisée. Un email de création de mot de passe a été envoyé à chaque membre."
            : "Inscription réussie ! Un email de création de mot de passe a été envoyé à vous et à chaque membre de votre équipe.",
        );
      } catch {
        setStatus("error");
        setMessage("Erreur de connexion au serveur.");
      }
    };

    finalize();
  }, [searchParams]);

  return (
    <section className="flex items-center justify-center h-screen p-10">
      <div className="max-w-lg w-full flex flex-col items-center gap-6 text-center">
        {status === "loading" && (
          <>
            <h1 className="text-h1 font-urbanist">Finalisation en cours...</h1>
            <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
              Nous confirmons votre paiement et créons les comptes de votre
              équipe.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-h1 font-urbanist">Bienvenue chez Glyms 🎉</h1>
            <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
              {message}
            </p>
            <MainButton
              color="bg-[var(--color-text)] font-poppins text-body-large min-w-[200px]"
              text="Aller à la connexion"
              type="button"
              onClick={() => router.push("/login")}
            />
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-h1 font-urbanist">Un souci est survenu</h1>
            <p className="text-body-small font-poppins text-[var(--color-secondary)]">
              {message}
            </p>
            <MainButton
              color="bg-[var(--color-text)] font-poppins text-body-large min-w-[200px]"
              text="Revenir à l'inscription"
              type="button"
              onClick={() => router.push("/register")}
            />
          </>
        )}
      </div>
    </section>
  );
}
