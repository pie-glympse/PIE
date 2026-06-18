"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import BackArrow from "@/components/ui/BackArrow";
import MainButton from "@/components/ui/MainButton";
import SubGroupPicker, {
    buildSubGroupSectionsFromEventGroups,
} from "@/components/event/ThemeGroupPicker";

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

        <div className="w-full">
          <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
            {eventData.title}
          </h1>
          {step === 1 && showThemeStep ? (
            <>
              <p className="text-h3 mb-4 font-poppins text-[var(--color-grey-three)]">
                Choisissez les sous-groupes que vous préférez
              </p>
              <SubGroupPicker
                sections={subGroupSections}
                selectedIds={selectedGoogleTagSubGroupIds}
                onToggle={toggleSubGroup}
              />
            </>
          ) : (
            <>
              <p className="text-h3 mb-4 font-poppins text-[var(--color-grey-three)]">
                Choisissez votre date préférée
              </p>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="px-4 py-2 border-2 border-[var(--color-grey-two)] rounded"
              />
            </>
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
