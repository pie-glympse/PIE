"use client"
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import MainButton from '@/components/ui/MainButton';
import BackArrow from '../../../components/ui/BackArrow';
import CategoryBtn from '@/components/ui/CategoryBtn';
import Modal from '@/components/layout/Modal';
import ChoiceLi from '@/components/ui/ChoiceLi';
import { StepperIndicator } from '@/components/forms/StepperIndicator';
import { generateDateRange } from '@/lib/utils/dateUtils';

const AnswerEventPage = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user, isLoading } = useUser();
    
    const eventId = params.id as string;
    const eventTitle = searchParams.get('eventTitle') || 'Événement';
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<{id: number, name: string}[]>([]);
    const [eventData, setEventData] = useState<{
        startDate?: string;
        endDate?: string;
        title?: string;
    } | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);

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

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            
            try {
                setLoadingEvent(true);
                const response = await fetch(`/api/events/${eventId}`);
                if (response.ok) {
                    const event = await response.json();
                    setEventData(event.event || event);
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'événement:', error);
            } finally {
                setLoadingEvent(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tags');
                if (response.ok) {
                    const tags = await response.json();
                    setAvailableTags(tags);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des tags:', error);
            }
        };
        fetchTags();
    }, []);

    const categories = availableTags.length > 0 
        ? availableTags.map(tag => tag.name)
        : [
            'Technologie', 'Design', 'Marketing', 'Finance', 'Ressources Humaines',
            'Ventes', 'Développement Personnel', 'Santé et Bien-être', 'Éducation',
            'Environnement', 'Art et Culture', 'Voyages', 'Sports et Loisirs',
            'Entrepreneuriat', 'Innovation', 'Leadership', 'Communication',
            'Gestion de Projet', 'Stratégie', 'Analyse de Données',
            'Intelligence Artificielle', 'Blockchain', 'Cybersécurité',
            'Développement Durable', 'Économie Circulaire'
        ];

    const dates = eventData?.startDate && eventData?.endDate 
        ? generateDateRange(eventData.startDate, eventData.endDate)
        : [];

    const preferences = [
        { id: '1', text: 'Halal' },
        { id: '2', text: 'Cacher' },
        { id: '3', text: 'Végétarienne' },
        { id: '4', text: 'Végan' },
        { id: '5', text: 'Sans gluten' },
        { id: '6', text: 'Sans Lactose' },
        { id: '7', text: 'Accès PMR' },
        { id: '8', text: 'Audioguide' },
        { id: '9', text: 'Lieux calmes' }
    ];

    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            }
            return [...prev, category];
        });
    };

    const handleDateClick = (date: string) => {
        setSelectedDates(prev => {
            if (prev.includes(date)) {
                return prev.filter(d => d !== date);
            }
            return [...prev, date];
        });
    };

    const handlePreferenceClick = (selectedIds: string[]) => {
        setSelectedPreferences(selectedIds);
    };

    const submitPreferences = async () => {
        if (!user || !eventId) return;

        setIsSubmitting(true);
        
        try {
            const selectedCategoryName = selectedCategories[0];
            const selectedTag = availableTags.find(tag => tag.name === selectedCategoryName);
            const tagId = selectedTag?.id || 1;

            const selectedDateStr = selectedDates[0];
            const [day, month, year] = selectedDateStr.split('/');
            const preferredDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();

            const requestBody = {
                userId: user.id,
                tagId: tagId,
                preferredDate: preferredDate,
                preferences: selectedPreferences
            };

            const response = await fetch(`/api/events/${eventId}/preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'envoi des préférences');
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
        if (currentStep < 3) {
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
        switch (currentStep) {
            case 1:
                return selectedCategories.length > 0;
            case 2:
                return selectedDates.length > 0;
            case 3:
                return true; // ✅ Étape 3 optionnelle - on peut toujours continuer
            default:
                return false;
        }
    };

    if (isLoading || loadingEvent) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    if (!user || !eventId) return null;

    if (dates.length === 0 && currentStep === 2) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-lg mb-4">Aucune date disponible pour cet événement.</p>
                    <button 
                        onClick={() => router.back()} 
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    const displayTitle = eventData?.title || eventTitle;

    return (
        <>
            <section className="h-screen overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
                <div className="h-full w-full flex flex-col gap-6 items-start p-10">
                    <BackArrow onClick={handleBack} className="" />
                    
                    <StepperIndicator currentStep={currentStep} totalSteps={3} />

                    <div className="w-full flex flex-col">
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Formulez vos Préférences pour {displayTitle}
                        </h1>
                        
                        {currentStep === 1 && (
                            <>
                                <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                                    Sélectionnez une ou plusieurs catégories :
                                </h3>
                                <div className="w-full">
                                    <ul className="flex flex-wrap gap-3 mb-6 list-none">
                                        {categories.map((category) => (
                                            <CategoryBtn
                                                key={category}
                                                text={category}
                                                isSelected={selectedCategories.includes(category)}
                                                onClick={() => handleCategoryClick(category)}
                                                isDate={false}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                                    Sélectionnez une ou plusieurs dates disponibles :
                                </h3>
                                <div className="w-full">
                                    <div className="max-h-80 overflow-y-auto">
                                        <ul className="flex flex-wrap gap-3 mb-6 list-none">
                                            {dates.map((date) => (
                                                <CategoryBtn
                                                    key={date}
                                                    text={date}
                                                    isSelected={selectedDates.includes(date)}
                                                    onClick={() => handleDateClick(date)}
                                                    isDate={true}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                                    Avez-vous des No Go à absolument prendre en compte ?
                                </h3>
                                <div className="w-full">
                                    <ChoiceLi
                                        choices={preferences}
                                        selectedChoices={selectedPreferences}
                                        onSelectionChange={handlePreferenceClick}
                                        otherPlaceholder="Autre préférence d'événement"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className='w-1/6'>
                        <MainButton
                            text={currentStep === 3 ? (isSubmitting ? "Envoi..." : "Finaliser") : "Continuer"}
                            onClick={handleNext}
                            disabled={!canContinue() || isSubmitting}
                            color="bg-[var(--color-text)] font-poppins text-body-large"
                        />
                    </div>
                </div>
            </section>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onButtonClick={() => {
                    setIsModalOpen(false);
                    router.push('/events');
                }}
                showSteppers={false}
                title="Félicitations !"
                text="Vos préférences ont été enregistrées avec succès."
                buttonText="Retour aux événements"
                stepContents={[{
                    title: "Félicitations !",
                    text: "Vos préférences ont été enregistrées avec succès.",
                    buttonText: "Retour aux événements",
                    image: "/images/mascotte/joy.png",
                    imagePosition: 'center' as const
                }]}
            />
        </>
    );
};

export default AnswerEventPage;
