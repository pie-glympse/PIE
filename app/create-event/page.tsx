"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MainButton from "@/components/ui/MainButton";
import BackArrow from "../../components/ui/BackArrow";
import EventForm from "@/components/forms/EventForm";
import { UserSelectionStep } from "@/components/forms/UserSelectionStep";
import { useUser } from "@/context/UserContext";

const Modal = dynamic(() => import("@/components/layout/Modal"), { ssr: false });

const CreateEventPage = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleFormSubmit = (data: EventFormData) => {
    setFormData(data);
    setCurrentStep(2);
  };

  const handleCreate = async () => {
    if (!user || !formData) return;
    const eventData = {
      ...formData,
      maxPersons: formData.maxPersons ? Number(formData.maxPersons) : null,
      costPerPerson: formData.costPerPerson ? Number(formData.costPerPerson) : null,
      maxDistance: formData.maxDistance ? Number(formData.maxDistance) : null,
      duration: formData.duration ? Number(formData.duration) : null,
      recurringRate: formData.recurringRate || null,
      state: "pending",
      userId: user.id,
      invitedUsers: selectedUserIds,
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
    } else {
      const error = await response.json();
      alert(error?.error || "Erreur lors de la création de l'événement");
    }
  };

  const canContinue = () => {
    if (currentStep === 1) return !!formData;
    if (currentStep === 2) return selectedUserIds.length > 0;
    return false;
  };

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
              else setCurrentStep(1);
            }}
          />

          <div className="flex items-center gap-4 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? "bg-[var(--color-main)] text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
            <div className={`w-8 h-1 ${currentStep >= 2 ? "bg-[var(--color-main)]" : "bg-gray-200"}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? "bg-[var(--color-main)] text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
          </div>

          <div className="w-full flex flex-col">
            {currentStep === 1 ? (
              <EventForm
                title="Créez vos évènements personnalisés !"
                subtitle="Entrez les informations générales de l'événement"
                buttonText="Continuer"
                initialData={formData || undefined}
                onSubmit={handleFormSubmit}
              />
            ) : (
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

          {currentStep !== 1 && (
            <div className="w-1/6">
              <MainButton
                text="Créer et inviter"
                onClick={handleCreate}
                disabled={!canContinue()}
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
        text="Votre événement a été créé et est maintenant disponible."
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
