"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MainButton from "@/components/ui/MainButton";
import BackArrow from "../../components/ui/BackArrow";
import EventDetailsStep, {
  type EventDetailsData,
} from "@/components/forms/EventDetailsStep";
import {
  EventCategoryStep,
  type EventCategoryChoice,
} from "@/components/forms/EventCategoryStep";
import { UserSelectionStep } from "@/components/forms/UserSelectionStep";
import {
  EventVisibilityStep,
  type EventVisibility,
} from "@/components/forms/EventVisibilityStep";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";

const Modal = dynamic(() => import("@/components/layout/Modal"), { ssr: false });

// Flux de création (arbre) :
// 1. Visibilité   → privé (invitations) ou public (places max)
// 2. Type         → Gastronomie / Culture / Divertissement / Sport
//                   ou « Je sais ce que je veux » (lieu précis)
// 3. Informations → formulaire divergent (plage de dates vs date connue,
//                   ville + distance vs lieu Google précis)
// 4. Invitations  → privé uniquement (collaborateurs + équipes entières)
const CreateEventPage = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { showPointsToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [categoryChoice, setCategoryChoice] =
    useState<EventCategoryChoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<EventDetailsData | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPublic = visibility === "public";
  const totalSteps = isPublic ? 3 : 4;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleDetailsSubmit = (data: EventDetailsData) => {
    setFormData(data);
    if (isPublic) {
      void handleCreate(data);
    } else {
      setCurrentStep(4);
    }
  };

  const handleCreate = async (dataOverride?: EventDetailsData) => {
    const payload = dataOverride ?? formData;
    if (!user || !payload || !categoryChoice) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        title: payload.title,
        description: payload.description,
        additionalInfo: payload.additionalInfo,
        costPerPerson: payload.costPerPerson ? Number(payload.costPerPerson) : null,
        dateKnown: payload.dateKnown,
        startDate: payload.startDate,
        endDate: payload.endDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        maxPersons: payload.maxPersons ? Number(payload.maxPersons) : null,
        city: payload.city,
        maxDistance: payload.maxDistance ? Number(payload.maxDistance) : null,
        isSpecificPlace: categoryChoice.kind === "specific",
        categoryId:
          categoryChoice.kind === "category" ? categoryChoice.categoryId : null,
        placeName: payload.placeName,
        placeAddress: payload.placeAddress,
        placeId: payload.placeId,
        placeLat: payload.placeLat,
        placeLng: payload.placeLng,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <section className="overflow-y-auto pt-24 flex flex-col items-center gap-10 p-10">
        <div className="h-full w-full flex flex-col gap-6 items-start p-10">
          <BackArrow
            onClick={() => {
              if (currentStep === 1) router.back();
              else setCurrentStep((s) => s - 1);
            }}
          />

          {/* Barre de progression segmentée (maquettes) */}
          <div className="flex items-center gap-2 mb-4 w-full max-w-xs">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  currentStep >= step
                    ? "bg-[var(--color-main)]"
                    : "bg-gray-200"
                }`}
              />
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
              <EventCategoryStep
                value={categoryChoice}
                onChange={setCategoryChoice}
                onContinue={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 3 && categoryChoice && (
              <EventDetailsStep
                mode={categoryChoice.kind === "specific" ? "specific" : "category"}
                requireMaxPersons={isPublic}
                buttonText={isPublic ? "Terminer" : "Continuer"}
                isSubmitting={isSubmitting}
                initialData={formData || undefined}
                onSubmit={handleDetailsSubmit}
              />
            )}

            {currentStep === 4 && !isPublic && (
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
                maxPersons={
                  formData?.maxPersons ? Number(formData.maxPersons) : null
                }
              />
            )}
          </div>

          {currentStep === 4 && !isPublic && (
            <div className="w-1/6">
              <MainButton
                text={isSubmitting ? "Création..." : "Terminer"}
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
          createdEventId
            ? router.push(`/events/${createdEventId}`)
            : router.push("/home")
        }
        showSteppers={false}
        title="Événement créé avec succès !"
        text={
          isPublic
            ? "Votre événement public est visible par toute l'entreprise."
            : "Vos invitations ont été envoyées."
        }
        buttonText="Voir l'événement"
        stepContents={[
          {
            title: "Félicitations !",
            text:
              categoryChoice?.kind === "specific"
                ? "Votre événement a été créé avec succès."
                : "Votre événement a été créé : les participants vont maintenant voter pour leurs préférences.",
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
