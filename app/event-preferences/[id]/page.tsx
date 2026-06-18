"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import BackArrow from "@/components/ui/BackArrow";
import MainButton from "@/components/ui/MainButton";
import SubGroupPicker, {
    buildSubGroupSectionsFromEventGroups,
} from "@/components/event/ThemeGroupPicker";
import { FormSection } from "@/components/ui/form/FormSection";
import { DateQuickPicker } from "@/components/ui/form/DateQuickPicker";

type EventSubGroup = {
  id: string;
  name: string;
  sortOrder?: number;
};

type EventGroup = {
  id: string;
  name: string;
  sortOrder?: number;
  subGroups: EventSubGroup[];
};

type EventData = {
  id: string;
  title: string;
  state?: string;
  isSpecificPlace?: boolean;
  isParticipant?: boolean;
  isCreator?: boolean;
  isPublic?: boolean;
  selectedGoogleTagGroups: EventGroup[];
};

export default function EventPreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useUser();
  const eventId = params.id as string;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedGoogleTagSubGroupIds, setSelectedGoogleTagSubGroupIds] =
    useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !user?.id) return;
      setLoadingEvent(true);
      setAccessDenied(null);
      try {
        const response = await fetch(
          `/api/events/${eventId}?userId=${encodeURIComponent(user.id)}`,
        );
        if (!response.ok) return;
        const data = await response.json();
        const event = data.event || data;

        const canAccess =
          event.isCreator ||
          event.isParticipant ||
          event.users?.some(
            (participant: { id: string }) =>
              String(participant.id) === String(user.id),
          );

        if (!canAccess) {
          setAccessDenied(
            event.isPublic
              ? "Rejoignez l'événement avec « Participer » avant de voter vos préférences."
              : "Acceptez l'invitation à l'événement avant de voter vos préférences.",
          );
          setEventData(null);
          return;
        }

        setEventData(event);
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [eventId, user?.id]);

  const subGroupSections = useMemo(
    () =>
      eventData?.selectedGoogleTagGroups
        ? buildSubGroupSectionsFromEventGroups(
            eventData.selectedGoogleTagGroups,
          )
        : [],
    [eventData?.selectedGoogleTagGroups],
  );

  const toggleSubGroup = (id: string) => {
    setSelectedGoogleTagSubGroupIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const submit = async () => {
    if (!user || !eventData) return;
    if (!eventData.isSpecificPlace && selectedGoogleTagSubGroupIds.length === 0)
      return;
    if (!preferredDate) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          selectedGoogleTagSubGroupIds,
          preferredDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Erreur envoi préférences");
      }
      window.dispatchEvent(new Event("preferencesUpdated"));
      router.push("/home");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingEvent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
      </div>
    );
  }
  if (!user || !eventData) {
    if (accessDenied) {
      return (
        <section className="h-screen overflow-y-auto pt-24 p-10 flex flex-col gap-8">
          <div className="h-full w-full flex flex-col gap-6 items-start p-10">
            <BackArrow onClick={() => router.back()} />
            <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
              {accessDenied}
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  const showThemeStep = !eventData.isSpecificPlace;
  const maxStep = showThemeStep ? 2 : 1;
  const canContinue =
    step === 1
      ? showThemeStep
        ? selectedGoogleTagSubGroupIds.length > 0
        : preferredDate.length > 0
      : preferredDate.length > 0;

  return (
    <section className="h-screen overflow-y-auto pt-24 p-10 flex flex-col gap-8">
      <div className="h-full w-full flex flex-col gap-6 items-start p-10">
        <BackArrow
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
        />

        <div className="w-full max-w-2xl">
          <h1 className="text-h1 mb-2 text-left font-urbanist">
            {eventData.title}
          </h1>
          <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-6">
            Étape {step} / {maxStep}
          </p>

          {step === 1 && showThemeStep ? (
            <FormSection
              title="Vos activités préférées"
              description="Sélectionnez un ou plusieurs sous-groupes"
              variant="main"
            >
              <SubGroupPicker
                sections={subGroupSections}
                selectedIds={selectedGoogleTagSubGroupIds}
                onToggle={toggleSubGroup}
              />
            </FormSection>
          ) : (
            <FormSection
              title="Votre date préférée"
              description="Quand souhaitez-vous participer ?"
              variant="sky"
            >
              <DateQuickPicker
                label="Date souhaitée"
                value={preferredDate}
                onChange={setPreferredDate}
                min={new Date().toISOString().split("T")[0]}
                hint="Les dates proposées par l'organisateur peuvent être ajustées après vote collectif."
              />
            </FormSection>
          )}
        </div>

        <div className="w-1/6">
          <MainButton
            text={
              step < maxStep
                ? "Continuer"
                : isSubmitting
                  ? "Envoi..."
                  : "Finaliser"
            }
            onClick={() => (step < maxStep ? setStep(step + 1) : submit())}
            disabled={!canContinue || isSubmitting}
            color="bg-[var(--color-text)] font-poppins text-body-large"
          />
        </div>
      </div>
    </section>
  );
}
