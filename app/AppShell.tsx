"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { UserProvider, useUser } from "../context/UserContext";
import FeedbackModal from "@/components/FeedbackModal";
import { useFeedbackNotification } from "@/hooks/useFeedbackNotification";
import { useOnboarding } from "@/hooks/useOnboarding";
import Modal from "@/components/layout/Modal";

const hideHeaderRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/first-connection"];

function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { showOnboarding, isChecking, markOnboardingAsSeen } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ouvrir le modal quand l'onboarding doit être affiché
  useEffect(() => {
    if (showOnboarding && !isChecking) {
      setIsModalOpen(true);
      setCurrentStep(1);
    }
  }, [showOnboarding, isChecking]);

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière étape : marquer comme vu et fermer
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      await markOnboardingAsSeen();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la finalisation de l'onboarding:", error);
      // Fermer le modal même en cas d'erreur pour ne pas bloquer l'utilisateur
      setIsModalOpen(false);
    }
  };

  const onboardingSteps = [
    {
      title: "Crée ton évènement en 2 minutes",
      text: "Choisis un nom d'événement, sélectionne les collaborateurs concernés, puis indique les plages de dates et horaires disponibles",
      buttonText: "Continuer",
      image: "/images/mascotte/joy.png",
      imagePosition: "center" as const,
    },
    {
      title: "On s'occupe du reste (presque)",
      text: "Les collaborateurs reçoivent un lien personnalisé pour indiquer leurs préférences (type de sortie, créneau, régime alimentaire ...)",
      buttonText: "Continuer",
      image: "/images/mascotte/mascotte-nrml.png",
      imagePosition: "center" as const,
    },
    {
      title: "3 idées d'activités, prêtes à lancer !",
      text: "Une fois toutes les réponses récoltées, l'algo vous propose 3 activités idéales. Il ne vous reste plus qu'à choisir !",
      buttonText: "Terminer",
      image: "/images/mascotte/magic.png",
      imagePosition: "center" as const,
    },
  ];

  return (
    <>
      {children}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleFinish}
          onButtonClick={handleNextStep}
          showSteppers={true}
          currentStep={currentStep}
          totalSteps={3}
          stepContents={onboardingSteps}
          lastStepButtonText="Terminer"
        />
      )}
    </>
  );
}

function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { pendingFeedback, clearPendingFeedback } = useFeedbackNotification();

  return (
    <>
      {children}
      {pendingFeedback && user && (
        <FeedbackModal
          isOpen={true}
          onClose={clearPendingFeedback}
          eventId={pendingFeedback.eventId}
          eventTitle={pendingFeedback.eventTitle || "Événement"}
          userId={user.id}
          notificationId={pendingFeedback.id}
        />
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [is404, setIs404] = useState(false);

  useEffect(() => {
    // Détecter si c'est une page 404 en vérifiant la classe sur le body
    const check404 = () => {
      setIs404(document.body.classList.contains("page-404"));
    };

    check404();
    const observer = new MutationObserver(check404);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const showHeader = !hideHeaderRoutes.includes(pathname) && !is404;

  return (
    <UserProvider>
      {showHeader && <Header />}
      <OnboardingProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </OnboardingProvider>
    </UserProvider>
  );
}
