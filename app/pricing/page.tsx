"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MainButton from "@/components/ui/MainButton";
import BackArrow from "@/components/ui/BackArrow";
import { useUser } from "@/context/UserContext";
import { GLYMS_PLAN_BENEFITS } from "@/lib/stripe-pricing";

interface PricingPlan {
  name: string;
  description: string | null;
  amount: string | null;
  intervalLabel: string;
  benefits: readonly string[];
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Chargement...
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/home");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const response = await fetch("/api/stripe/pricing");
        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.error || "Impossible de charger l'offre");
          setPlan({
            name: "Glyms Pro",
            description: null,
            amount: null,
            intervalLabel: "mois",
            benefits: data.benefits || GLYMS_PLAN_BENEFITS,
          });
          return;
        }

        setPlan(data);
      } catch {
        setErrorMsg("Erreur de connexion au serveur");
        setPlan({
          name: "Glyms Pro",
          description: null,
          amount: null,
          intervalLabel: "mois",
          benefits: GLYMS_PLAN_BENEFITS,
        });
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadPlan();
  }, []);

  const handleSubscribe = async () => {
    setErrorMsg("");
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (response.status === 400) {
        setErrorMsg(
          data.error || "Veuillez d'abord inscrire votre équipe.",
        );
        setIsCheckingOut(false);
        router.push("/register");
        return;
      }

      if (!response.ok || !data.url) {
        setErrorMsg(data.error || "Impossible de démarrer le paiement");
        setIsCheckingOut(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setErrorMsg("Erreur de connexion au serveur");
      setIsCheckingOut(false);
    }
  };

  if (isLoading || user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
      </div>
    );
  }

  return (
    <section className="flex flex-row min-h-screen items-center gap-10 p-10">
      <div className="h-full w-full flex flex-col gap-6 justify-between items-start p-6 md:p-10">
        <div className="flex w-full items-center justify-between">
          <BackArrow onClick={() => router.push("/register")} className="" />
          <Link href="/login" aria-label="Retour à l'accueil">
            <Image
              src="/images/logo/Logotype.svg"
              alt="Logo Glyms"
              width={120}
              height={120}
              sizes="120px"
            />
          </Link>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-xl">
            <h1 className="text-h1 mb-3 font-urbanist text-left">
              Accédez à Glyms pour votre équipe
            </h1>
            <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-8">
              Un abonnement mensuel pour créer votre espace entreprise et
              inscrire toute votre équipe.
            </p>

            {canceled && (
              <div className="mb-4 rounded border border-[var(--color-grey-two)] bg-[var(--color-grey-one)] px-4 py-3 text-body-small font-poppins text-[var(--color-grey-three)]">
                Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
              </div>
            )}

            <div className="rounded-2xl border-2 border-[var(--color-grey-two)] bg-white p-8 shadow-sm">
              <div className="mb-6 border-b border-[var(--color-grey-two)] pb-6">
                <p className="text-body-small font-poppins uppercase tracking-wide text-[var(--color-grey-three)]">
                  Offre unique
                </p>
                <h2 className="text-h2 font-urbanist mt-2">
                  {isLoadingPlan ? "Chargement..." : plan?.name || "Glyms Pro"}
                </h2>
                {plan?.description && (
                  <p className="mt-2 text-body-small font-poppins text-[var(--color-grey-three)]">
                    {plan.description}
                  </p>
                )}
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-h1 font-urbanist">
                    {plan?.amount ?? "—"}
                  </span>
                  {plan?.amount && (
                    <span className="pb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                      / {plan.intervalLabel}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {(plan?.benefits || GLYMS_PLAN_BENEFITS).map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-body-small font-poppins text-[var(--color-text)]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-main)] text-xs font-bold">
                      ✓
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {errorMsg && (
                <div className="mb-4 text-body-small font-poppins text-red-600">
                  {errorMsg}
                </div>
              )}

              <MainButton
                color="bg-[var(--color-text)] font-poppins text-body-large w-full"
                text={
                  isCheckingOut
                    ? "Redirection vers Stripe..."
                    : "S'abonner et continuer"
                }
                onClick={handleSubscribe}
                disabled={isCheckingOut || isLoadingPlan}
              />

              <p className="mt-4 text-center text-body-small font-poppins text-[var(--color-grey-three)]">
                Paiement sécurisé par Stripe. Annulation possible à tout moment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)]">
          <span>Vous avez déjà un compte ?</span>
          <span>
            <u className="cursor-pointer" onClick={() => router.push("/login")}>
              Connectez-vous
            </u>
          </span>
        </div>
      </div>
    </section>
  );
}
