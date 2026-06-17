"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import TeamRegisterForm from "@/components/forms/TeamRegisterForm";
import BackArrow from "@/components/ui/BackArrow";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Vérification de votre abonnement...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, logout } = useUser();
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (isLoading || verificationStarted.current) return;
    verificationStarted.current = true;

    const verifyAccess = async () => {
      const sessionId = searchParams.get("session_id");

      try {
        if (sessionId) {
          await logout();

          const response = await fetch("/api/stripe/verify-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sessionId }),
          });
          const data = await response.json();

          if (!response.ok) {
            setAccessError(
              data.error ||
                "Paiement non confirmé. Veuillez compléter l'abonnement.",
            );
            setHasAccess(false);
            router.replace("/pricing");
            return;
          }

          setHasAccess(true);
          router.replace("/register");
          return;
        }

        if (user) {
          router.replace("/home");
          return;
        }

        const response = await fetch("/api/stripe/verify-session", {
          credentials: "include",
        });
        const data = await response.json();
        if (!data.hasAccess) {
          router.replace("/pricing");
          return;
        }

        setHasAccess(true);
      } catch {
        setAccessError("Impossible de vérifier votre abonnement");
        router.replace("/pricing");
      } finally {
        setIsCheckingPayment(false);
      }
    };

    verifyAccess();
  }, [isLoading, user, searchParams, router, logout]);

  if (isLoading || isCheckingPayment) {
    return (
      <div className="flex items-center justify-center h-screen">
        Vérification de votre abonnement...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        {accessError || "Redirection..."}
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <section className="flex flex-row h-screen items-center gap-10 p-10">
      <div className="h-full w-full flex flex-col gap-6 justify-between items-start p-10">
        <div>
          <BackArrow onClick={() => router.push("/pricing")} className="" />
        </div>
        <div className="w-full flex justify-center">
          <TeamRegisterForm
            title={
              <>
                Inscrivez votre équipe
                <br />
                Créez votre espace Entreprise
              </>
            }
            buttonText="Inscrire mon équipe"
          />
        </div>

        <div className="flex w-full flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)]">
          <span>Vous avez déjà un compte ?</span>
          <span>
            <u className="cursor-pointer" onClick={handleLoginClick}>
              Connectez-vous
            </u>
          </span>
        </div>
      </div>
    </section>
  );
}
