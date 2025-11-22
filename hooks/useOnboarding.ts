import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

export const useOnboarding = () => {
  const { user, isLoading } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoading || !user) {
        setIsChecking(false);
        return;
      }

      try {
        // Vérifier si l'utilisateur a déjà vu l'onboarding
        const response = await fetch(`/api/users/${user.id}`);

        if (response.ok) {
          const userData = await response.json();
          // Afficher l'onboarding seulement si l'utilisateur ne l'a pas encore vu
          const hasSeen = userData.hasSeenOnboarding === true || userData.hasSeenOnboarding === "true";
          const shouldShow = !hasSeen;
          setShowOnboarding(shouldShow);
        } else {
          // En cas d'erreur, ne pas afficher l'onboarding
          setShowOnboarding(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'onboarding:", error);
        setShowOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, isLoading]);

  const markOnboardingAsSeen = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'onboarding:", error);
    }
  };

  return {
    showOnboarding,
    isChecking,
    markOnboardingAsSeen,
  };
};
