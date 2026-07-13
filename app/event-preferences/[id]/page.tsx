"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import BackArrow from "@/components/ui/BackArrow";
import MainButton from "@/components/ui/MainButton";
import DragRangeCalendar from "@/components/ui/DragRangeCalendar";

type QuestionOption = {
  id: string;
  label: string;
  sortOrder: number;
};

type Question = {
  id: string;
  text: string;
  sortOrder: number;
  multiSelect: boolean;
  maxChoices: number;
  options: QuestionOption[];
};

type QuestionnaireData = {
  event: {
    id: string;
    title: string;
    state?: string;
    dateKnown: boolean;
    startDate?: string | null;
    endDate?: string | null;
    proposedDates?: string[];
    isSpecificPlace: boolean;
    category?: { id: string; name: string; slug: string } | null;
  };
  questions: Question[];
  myAnswerOptionIds: string[];
  myPreferredDate?: string | null;
  myPreferredDates?: string[];
  hasAnswered: boolean;
};

const dayKey = (iso: string) => iso.split("T")[0];

// Liste des jours de la plage (chips cliquables si la plage est raisonnable)
function buildRangeDays(start?: string | null, end?: string | null): string[] {
  if (!start || !end) return [];
  const days: string[] = [];
  const current = new Date(dayKey(start));
  const last = new Date(dayKey(end));
  while (current <= last && days.length <= 60) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Questionnaire participant : le moteur de la future requête Google Places.
// Étapes : [date dans la plage si non connue] puis une question par étape.
export default function EventPreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useUser();
  const eventId = params.id as string;

  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [preferredDates, setPreferredDates] = useState<string[]>([]);
  const [selectedByQuestion, setSelectedByQuestion] = useState<
    Record<string, string[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (!eventId || !user?.id) return;
      setLoading(true);
      setAccessDenied(null);
      try {
        const response = await fetch(
          `/api/events/${eventId}/questionnaire?userId=${encodeURIComponent(user.id)}`,
        );
        if (response.status === 403) {
          const err = await response.json().catch(() => null);
          setAccessDenied(
            err?.message ||
              "Rejoignez l'événement avant de répondre au questionnaire.",
          );
          return;
        }
        if (!response.ok) return;
        const payload: QuestionnaireData = await response.json();
        setData(payload);

        // Pré-remplir avec mes réponses précédentes (re-vote possible)
        if (payload.myPreferredDates && payload.myPreferredDates.length > 0) {
          setPreferredDates([...payload.myPreferredDates].map(dayKey).sort());
        } else if (payload.myPreferredDate) {
          setPreferredDates([dayKey(payload.myPreferredDate)]);
        }
        if (payload.myAnswerOptionIds.length > 0) {
          const prefill: Record<string, string[]> = {};
          for (const question of payload.questions) {
            prefill[question.id] = question.options
              .filter((o) => payload.myAnswerOptionIds.includes(o.id))
              .map((o) => o.id);
          }
          setSelectedByQuestion(prefill);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionnaire();
  }, [eventId, user?.id]);

  const hasDateStep = data ? !data.event.dateKnown : false;
  const questions = data?.questions ?? [];
  const totalSteps = (hasDateStep ? 1 : 0) + questions.length;
  // Dates proposées explicites (non consécutives) si présentes, sinon la plage
  const rangeDays = useMemo(() => {
    const proposed = data?.event.proposedDates;
    if (proposed && proposed.length > 0) {
      return [...proposed].map(dayKey).sort();
    }
    return buildRangeDays(data?.event.startDate, data?.event.endDate);
  }, [
    data?.event.proposedDates,
    data?.event.startDate,
    data?.event.endDate,
  ]);

  const currentQuestion: Question | null = (() => {
    const questionIndex = stepIndex - (hasDateStep ? 1 : 0);
    if (questionIndex < 0 || questionIndex >= questions.length) return null;
    return questions[questionIndex];
  })();

  const isDateStep = hasDateStep && stepIndex === 0;

  const toggleOption = (question: Question, optionId: string) => {
    setSelectedByQuestion((prev) => {
      const current = prev[question.id] ?? [];
      if (question.multiSelect) {
        if (current.includes(optionId)) {
          return { ...prev, [question.id]: current.filter((v) => v !== optionId) };
        }
        if (current.length >= question.maxChoices) return prev; // limite atteinte
        return { ...prev, [question.id]: [...current, optionId] };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  };

  const canContinue = isDateStep
    ? preferredDates.length > 0
    : currentQuestion
      ? (selectedByQuestion[currentQuestion.id]?.length ?? 0) > 0
      : false;

  const submit = async () => {
    if (!user || !data) return;
    setIsSubmitting(true);
    try {
      const optionIds = questions.flatMap(
        (question) => selectedByQuestion[question.id] ?? [],
      );
      const response = await fetch(`/api/events/${eventId}/questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          optionIds,
          preferredDates: hasDateStep ? preferredDates : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Erreur lors de l'envoi des réponses");
      }
      window.dispatchEvent(new Event("preferencesUpdated"));
      router.push(`/events/${eventId}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
      </div>
    );
  }

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

  if (!user || !data) return null;

  // Lieu précis + date connue : rien à voter
  if (totalSteps === 0) {
    return (
      <section className="h-screen overflow-y-auto pt-24 p-10 flex flex-col gap-8">
        <div className="h-full w-full flex flex-col gap-6 items-start p-10">
          <BackArrow onClick={() => router.back()} />
          <h1 className="text-h1 font-urbanist">{data.event.title}</h1>
          <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
            Le lieu et la date de cet événement sont déjà fixés — il n&apos;y a
            rien à voter. À bientôt !
          </p>
          <div className="w-1/6">
            <MainButton
              text="Voir l'événement"
              onClick={() => router.push(`/events/${eventId}`)}
              color="bg-[var(--color-text)] font-poppins text-body-large"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-screen overflow-y-auto pt-24 p-10 flex flex-col gap-8">
      <div className="h-full w-full flex flex-col gap-6 items-start p-10">
        <BackArrow
          onClick={() =>
            stepIndex > 0 ? setStepIndex(stepIndex - 1) : router.back()
          }
        />

        {/* Barre de progression segmentée (cohérente avec la création) */}
        <div className="flex items-center gap-2 w-full max-w-xs mx-auto">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                stepIndex >= i ? "bg-[var(--color-main)]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="w-full max-w-3xl mx-auto">
          <h1 className="text-h1 mb-2 text-left font-urbanist">
            {data.event.title}
          </h1>
          <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-6">
            Étape {stepIndex + 1} / {totalSteps}
            {data.event.category ? ` — ${data.event.category.name}` : ""}
          </p>

          {isDateStep ? (
            <>
              <p className="text-h3 mb-1 font-poppins text-[var(--color-text)]">
                Quelles dates vous conviendraient ?
              </p>
              <p className="text-body-small mb-4 font-poppins text-[var(--color-grey-three)]">
                Cliquez ou glissez pour cocher tous les jours qui vous vont —{" "}
                {preferredDates.length} sélectionné
                {preferredDates.length > 1 ? "s" : ""}
              </p>
              {rangeDays.length > 0 ? (
                <DragRangeCalendar
                  selectedDates={preferredDates}
                  onChange={setPreferredDates}
                  allowedDates={rangeDays}
                  minDate={rangeDays[0]}
                />
              ) : (
                <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
                  Aucune date proposée par l&apos;organisateur.
                </p>
              )}
            </>
          ) : currentQuestion ? (
            <>
              <p className="text-h3 mb-1 font-poppins text-[var(--color-text)]">
                {currentQuestion.text}
              </p>
              <p className="text-body-small mb-4 font-poppins text-[var(--color-grey-three)]">
                {currentQuestion.multiSelect
                  ? `Jusqu'à ${currentQuestion.maxChoices} choix — ${
                      selectedByQuestion[currentQuestion.id]?.length ?? 0
                    }/${currentQuestion.maxChoices} sélectionné(s)`
                  : "1 choix"}
              </p>
              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((option) => {
                  const selected = (
                    selectedByQuestion[currentQuestion.id] ?? []
                  ).includes(option.id);
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => toggleOption(currentQuestion, option.id)}
                      className={`flex items-center justify-between text-left px-5 py-3 rounded-lg border-2 font-poppins transition-all ${
                        selected
                          ? "border-[var(--color-main)] bg-[#E9F1FE]"
                          : "border-[var(--color-grey-two)] bg-white hover:border-[var(--color-main)]"
                      }`}
                    >
                      <span className="text-body-large text-[var(--color-text)]">
                        {option.label}
                      </span>
                      <span
                        aria-hidden
                        className={`inline-flex w-5 h-5 shrink-0 items-center justify-center border-2 transition-colors ${
                          currentQuestion.multiSelect ? "rounded" : "rounded-full"
                        } ${
                          selected
                            ? "border-[var(--color-main)] bg-[var(--color-main)]"
                            : "border-[var(--color-grey-two)]"
                        }`}
                      >
                        {selected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <div className="w-1/6 min-w-[160px] mx-auto">
          <MainButton
            text={
              stepIndex < totalSteps - 1
                ? "Continuer"
                : isSubmitting
                  ? "Envoi..."
                  : "Finaliser"
            }
            onClick={() =>
              stepIndex < totalSteps - 1 ? setStepIndex(stepIndex + 1) : submit()
            }
            disabled={!canContinue || isSubmitting}
            color="bg-[var(--color-text)] font-poppins text-body-large"
          />
        </div>
      </div>
    </section>
  );
}
