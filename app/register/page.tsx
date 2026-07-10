"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import TeamRegisterForm from "@/components/forms/TeamRegisterForm";
import BackArrow from "@/components/ui/BackArrow";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Chargement...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/home");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
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
          <BackArrow onClick={() => router.push("/greetings")} className="" />
        </div>
        <div className="w-full flex flex-col items-center gap-4">
          <TeamRegisterForm
            title={
              <>
                Inscrivez votre équipe
                <br />
                Créez votre espace Entreprise
              </>
            }
            buttonText="Continuer vers l'abonnement"
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
