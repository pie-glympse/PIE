"use client"
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'
import { useUser } from '../../../context/UserContext';
import MainButton from '@/components/ui/MainButton';
import BackArrow from '../../../components/ui/BackArrow';
import CategoryBtn from '@/components/ui/CategoryBtn';
import Modal from '@/components/layout/Modal';
import ChoiceLi from '@/components/ui/ChoiceLi';

const AnswerEventPage = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user, isLoading } = useUser();
    
    // ✅ Récupérer eventId depuis les params et eventTitle depuis les query params
    const eventId = params.id as string;
    const eventTitle = searchParams.get('eventTitle') || 'Événement';
    
    // État pour gérer l'étape actuelle
    const [currentStep, setCurrentStep] = useState(1);
    
    // État pour la modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // États pour chaque étape
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

    // ✅ Charger les tags depuis l'API
    const [availableTags, setAvailableTags] = useState<{id: number, name: string}[]>([]);

    // Redirect if not logged in
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    // Redirect if no eventId
    useEffect(() => {
        if (!eventId) {
            router.push("/events");
        }
    }, [eventId, router]);

    // ✅ Charger les tags disponibles
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

    // Données pour chaque étape (utilisation des tags de l'API si disponibles)
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

    const dates = [
        '11/03/2025', '12/03/2025', '13/03/2025', '14/03/2025', '15/03/2025',
        '18/03/2025', '19/03/2025', '20/03/2025', '21/03/2025', '22/03/2025',
        '25/03/2025', '26/03/2025', '27/03/2025', '28/03/2025', '29/03/2025',
    ];

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

    // Handlers pour chaque étape
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

    // ✅ Fonction pour soumettre les préférences à l'API
    const submitPreferences = async () => {
        if (!user || !eventId) return;

        setIsSubmitting(true);
        
        try {
            // Trouver l'ID du premier tag sélectionné
            const selectedCategoryName = selectedCategories[0];
            const selectedTag = availableTags.find(tag => tag.name === selectedCategoryName);
            const tagId = selectedTag?.id || 1; // Fallback vers tag 1&

            // Convertir la première date sélectionnée en format ISO
            const selectedDateStr = selectedDates[0];
            const [day, month, year] = selectedDateStr.split('/');
            const preferredDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();

            const requestBody = {
                userId: user.id,
                tagId: tagId,
                preferredDate: preferredDate,
                // ✅ Ajouter les préférences comme métadonnées (optionnel)
                preferences: selectedPreferences
            };

            console.log('Envoi des préférences:', requestBody);

            const response = await fetch(`/api/events/${eventId}/preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'envoi des préférences');
            }

            const result = await response.json();
            console.log('Préférences sauvegardées:', result);
            
            // Ouvrir la modal de succès
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

    // Fonction pour passer à l'étape suivante
    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Dernière étape - soumettre les préférences
            submitPreferences();
        }
    };

    // Fonction pour revenir à l'étape précédente
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    // Fonction pour vérifier si on peut continuer
    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return selectedCategories.length > 0;
            case 2:
                return selectedDates.length > 0;
            case 3:
                return selectedPreferences.length > 0;
            default:
                return false;
        }
    };

    // Handlers pour la modal
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalButtonClick = () => {
        setIsModalOpen(false);
        router.push('/events'); // Retour à la liste des événements
    };

    // Loading states
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    if (!user) {
        return null;
    }

    if (!eventId) {
        return <div className="flex items-center justify-center h-screen">Événement non trouvé</div>;
    }

    // Fonction pour obtenir le contenu de l'étape actuelle
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Formulez vos Préférences pour {eventTitle}
                        </h1>
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
                );

            case 2:
                return (
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Formulez vos Préférences pour {eventTitle}
                        </h1>
                        <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                            Sélectionnez une ou plusieurs dates :
                        </h3>
                        <div className="w-full">
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
                    </>
                );

            case 3:
                return (
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Formulez vos Préférences pour {eventTitle}
                        </h1>
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
                );

            default:
                return null;
        }
    };

    return (
        <>
            <section className="flex flex-row h-screen items-center gap-10 p-10">
                <div className="h-full w-full flex flex-col gap-6 items-start p-10">
                    <div>
                        <BackArrow onClick={handleBack} className="" />
                    </div>
                    
                    {/* Indicateur d'étape */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            currentStep >= 1 ? 'bg-[var(--color-main)] text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            1
                        </div>
                        <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-[var(--color-main)]' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            currentStep >= 2 ? 'bg-[var(--color-main)] text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            2
                        </div>
                        <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-[var(--color-main)]' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            currentStep >= 3 ? 'bg-[var(--color-main)] text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            3
                        </div>
                    </div>

                    <div className="w-full flex flex-col">
                        {renderStepContent()}
                    </div>
                    
                    {/* Bouton en bas */}
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

            {/* Modal simplifiée */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onButtonClick={handleModalButtonClick}
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