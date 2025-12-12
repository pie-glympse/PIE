"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import MainButton from '@/components/ui/MainButton';
import BackArrow from '@/components/ui/BackArrow';
import ChoiceLi from '@/components/ui/ChoiceLi';
import { StepperIndicator } from '@/components/forms/StepperIndicator';
import { getQuestionsForActivityType, type Question } from '@/lib/preferences/questionsConfig';

interface EventData {
  id: string;
  title: string;
  activityType?: string;
  state?: string;
}

export default function EventPreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();
  
  const eventId = params.id as string;
  const eventTitle = searchParams.get('eventTitle') || 'Événement';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Stocker les réponses : { questionId: answerIds[] }
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!eventId) {
      router.push("/events");
    }
  }, [eventId, router]);

  // Charger les données de l'événement
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      
      try {
        setLoadingEvent(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (response.ok) {
          const data = await response.json();
          const event = data.event || data;
          setEventData({
            id: event.id,
            title: event.title,
            activityType: event.activityType,
            state: event.state,
          });
          
          // Charger les questions selon le type d'activité
          const eventQuestions = getQuestionsForActivityType(event.activityType);
          setQuestions(eventQuestions);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'événement:', error);
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Vérifier si l'utilisateur a déjà répondu
  useEffect(() => {
    const checkExistingPreferences = async () => {
      if (!user || !eventId) return;
      
      try {
        const response = await fetch(`/api/user-event-preferences?userId=${user.id}`);
        if (response.ok) {
          const preferences = await response.json();
          const eventPreference = preferences.find(
            (p: any) => p.event.id === eventId
          );
          
          if (eventPreference) {
            // L'utilisateur a déjà répondu, rediriger vers la page de détail
            router.push(`/events/${eventId}`);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des préférences:', error);
      }
    };
    
    if (user && eventId) {
      checkExistingPreferences();
    }
  }, [user, eventId, router]);

  // Vérifier si l'événement est déjà confirmé
  useEffect(() => {
    if (eventData?.state === 'confirmed') {
      // Si l'événement est confirmé, rediriger vers la page de détail
      router.push(`/events/${eventId}`);
    }
  }, [eventData, eventId, router]);

  const handleAnswerChange = (questionId: string, selectedAnswerIds: string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedAnswerIds,
    }));
  };

  const submitPreferences = async () => {
    if (!user || !eventId || !eventData) return;

    setIsSubmitting(true);

    try {
      // Convertir les réponses en format pour l'API
      const answersArray = Object.entries(answers).map(([questionId, answerIds]) => ({
        questionId,
        answerIds,
      }));

      const response = await fetch(`/api/events/${eventId}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          answers: answersArray,
          activityType: eventData.activityType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        const errorMessage = errorData.error || errorData.message || 'Erreur lors de l\'envoi des préférences';
        const errorDetails = errorData.details ? `\nDétails: ${JSON.stringify(errorData.details, null, 2)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des préférences:', error);
      if (error instanceof Error) {
        alert(`Erreur: ${error.message}`);
      } else {
        alert('Une erreur inconnue est survenue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      submitPreferences();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const canContinue = () => {
    if (questions.length === 0) return false;
    const currentQuestion = questions[currentStep - 1];
    if (!currentQuestion) return false;
    
    const selectedAnswers = answers[currentQuestion.id] || [];
    
    if (currentQuestion.type === 'single') {
      return selectedAnswers.length === 1;
    } else {
      return selectedAnswers.length > 0;
    }
  };

  if (isLoading || loadingEvent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
      </div>
    );
  }

  if (!user || !eventId || !eventData) return null;

  // Si pas de questions configurées, afficher un message
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">
            Aucune question de préférences configurée pour ce type d'événement.
          </p>
          <button 
            onClick={() => router.push(`/events/${eventId}`)} 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retour à l'événement
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep - 1];
  const displayTitle = eventData.title || eventTitle;

  return (
    <>
      <section className="h-screen overflow-y-auto md:overflow-hidden pt-24 p-10 flex flex-col gap-8">
        <div className="h-full w-full flex flex-col gap-6 items-start p-10">
          <BackArrow onClick={handleBack} className="" />
          
          <StepperIndicator currentStep={currentStep} totalSteps={questions.length} />

          <div className="w-full flex flex-col">
            <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
              {currentQuestion.text}
            </h1>
            
            <p className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
              Vos réponses nous permettront de cibler le lieu idéal pour l'évènement !
            </p>

            <div className="w-full">
              <ChoiceLi
                choices={currentQuestion.answers.map(answer => ({
                  id: answer.id,
                  text: answer.text,
                }))}
                selectedChoices={answers[currentQuestion.id] || []}
                onSelectionChange={(selectedIds) => 
                  handleAnswerChange(currentQuestion.id, selectedIds)
                }
                singleSelection={currentQuestion.type === 'single'}
              />
            </div>
          </div>
          
          <div className='w-1/6'>
            <MainButton
              text={currentStep === questions.length 
                ? (isSubmitting ? "Envoi..." : "Finaliser") 
                : "Continuer"}
              onClick={handleNext}
              disabled={!canContinue() || isSubmitting}
              color="bg-[var(--color-text)] font-poppins text-body-large"
            />
          </div>
        </div>
      </section>

      {/* Modal de confirmation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold font-urbanist text-[var(--color-text)] mb-4">
              Félicitations !
            </h3>
            <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-6">
              Vos préférences ont été enregistrées avec succès.
            </p>
            <button
              onClick={() => {
                setIsModalOpen(false);
                router.push(`/events/${eventId}`);
              }}
              className="w-full px-6 py-3 bg-[var(--color-text)] text-white rounded-lg hover:opacity-90 transition font-poppins font-medium"
            >
              Retour à l'événement
            </button>
          </div>
        </div>
      )}
    </>
  );
}
