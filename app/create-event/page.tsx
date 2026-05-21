"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MainButton from "@/components/ui/MainButton";
import BackArrow from "../../components/ui/BackArrow";
import EventForm from "@/components/forms/EventForm";
import { UserSelectionStep } from "@/components/forms/UserSelectionStep";
import {
  EventVisibilityStep,
  type EventVisibility,
} from "@/components/forms/EventVisibilityStep";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";

const Modal = dynamic(() => import("@/components/layout/Modal"), { ssr: false });

const CreateEventPage = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { showPointsToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [isModalOpen, setIsModalOpen] = useState(false);

  type EventFormData = {
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    maxPersons: string;
    costPerPerson: string;
    city: string;
    maxDistance: string;
    placeName?: string;
    placeAddress?: string;
    recurring: boolean;
    duration: string;
    recurringRate: string;
    isSpecificPlace: boolean;
    googleTagIds: string[];
  };

  const [formData, setFormData] = useState<EventFormData | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPublic = visibility === "public";
  const totalSteps = isPublic ? 2 : 3;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleFormSubmit = (data: EventFormData) => {
    setFormData(data);
    if (isPublic) {
      void handleCreate(data);
    } else {
      setCurrentStep(3);
    }
  };

  const handleCreate = async (dataOverride?: EventFormData) => {
    const payload = dataOverride ?? formData;
    if (!user || !payload) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        ...payload,
        maxPersons: payload.maxPersons ? Number(payload.maxPersons) : null,
        costPerPerson: payload.costPerPerson ? Number(payload.costPerPerson) : null,
        maxDistance: payload.maxDistance ? Number(payload.maxDistance) : null,
        duration: payload.duration ? Number(payload.duration) : null,
        recurringRate: payload.recurringRate || null,
        state: "pending",
        userId: user.id,
        isPublic,
        invitedUsers: isPublic ? [] : selectedUserIds,
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setCreatedEventId(createdEvent.id);
        setIsModalOpen(true);
        window.dispatchEvent(new Event("eventsUpdated"));
        showPointsToast(30, "avoir créé un événement");
      } else {
        const error = await response.json();
        alert(error?.error || "Erreur lors de la création de l'événement");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canContinuePrivateInvite = () => selectedUserIds.length > 0;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  if (!user) return null;

  return (
    <>
      <section className="overflow-y-auto md:overflow-hidden pt-24 flex flex-col items-center gap-10 p-10">
        <div className="h-full w-full flex flex-col gap-6 items-start p-10">
          <BackArrow
            onClick={() => {
              if (currentStep === 1) router.back();
              else setCurrentStep((s) => s - 1);
            }}
          />

          <div className="flex items-center gap-4 mb-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
              <div key={step}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step
                      ? "bg-[var(--color-main)] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`w-8 h-1 ${currentStep > step ? "bg-[var(--color-main)]" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col">
            {currentStep === 1 && (
              <EventVisibilityStep
                value={visibility}
                onChange={setVisibility}
                onContinue={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <EventForm
                title="Créez vos évènements personnalisés !"
                subtitle="Entrez les informations générales de l'événement"
                buttonText={isPublic ? "Créer l'événement" : "Continuer"}
                requireMaxPersons={isPublic}
                initialData={formData || undefined}
                onSubmit={handleFormSubmit}
              />
            )}

            {currentStep === 3 && !isPublic && (
              <UserSelectionStep
                title="Créez vos évènements personnalisés !"
                subtitle="Séléctionnez vos collaborateurs"
                currentUserId={user.id || ""}
                selectedUserIds={selectedUserIds}
                onUserToggle={(userId) =>
                  setSelectedUserIds((prev) =>
                    prev.includes(userId)
                      ? prev.filter((id) => id !== userId)
                      : [...prev, userId],
                  )
                }
              />
            )}
          </div>

          {currentStep === 3 && !isPublic && (
            <div className="w-1/6">
              <MainButton
                text={isSubmitting ? "Création..." : "Créer et inviter"}
                onClick={() => handleCreate()}
                disabled={!canContinuePrivateInvite() || isSubmitting}
                color="bg-[var(--color-text)] font-poppins text-body-large"
              />
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onButtonClick={() =>
          createdEventId ? router.push(`/events/${createdEventId}`) : router.push("/home")
        }
        showSteppers={false}
        title="Événement créé avec succès !"
        text={
          isPublic
            ? "Votre événement public est visible par toute l'entreprise."
            : "Votre événement a été créé et est maintenant disponible."
        }
        buttonText="Voir l'événement"
        stepContents={[
          {
            title: "Félicitations !",
            text: "Votre événement a été créé avec succès.",
            buttonText: "Voir l'événement",
            image: "/images/mascotte/joy.png",
            imagePosition: "center" as const,
          },
        ]}
      />
    </>
  );
};

export default CreateEventPage;
