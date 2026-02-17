"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MainButton from '@/components/ui/MainButton';
import BackArrow from '../../components/ui/BackArrow';
import { EventTypeCards } from '@/components/ui/EventTypeCard';
import EventForm from '@/components/forms/EventForm';
import { UserSelectionStep } from '@/components/forms/UserSelectionStep';
import { useUser } from '@/context/UserContext';

const Modal = dynamic(() => import('@/components/layout/Modal'), {
  ssr: false,
});

const CreateEventPage = () => {
    const router = useRouter();
    const { user, isLoading } = useUser();
    
    // État pour gérer l'étape actuelle (maintenant 3 étapes)
    const [currentStep, setCurrentStep] = useState(1);
    
    // État pour la modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // États pour chaque étape
    const [selectedEventType, setSelectedEventType] = useState<string>('');
    
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
    };

    const [formData, setFormData] = useState<EventFormData | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [suggestedActivities, setSuggestedActivities] = useState<any[]>([]);
    const [createdEventId, setCreatedEventId] = useState<string | null>(null);

    // Données pour chaque étape - Types d'événements avec catégories Google Places API
    const eventTypes = [
        { 
            id: '1', 
            text: 'Gastronomie', 
            image: '/images/mascotte/afterwork.png',
            icon: '🍽️',
            placeTypes: ['restaurant', 'cafe', 'bar']
        },
        { 
            id: '2', 
            text: 'Culture',
            image: '/images/mascotte/game.png',
            icon: '🎭',
            placeTypes: ['museum', 'art_gallery', 'theater']
        },
        { 
            id: '3', 
            text: 'Nature & Bien-être', 
            image: '/images/mascotte/sad_1.png',
            icon: '🌳',
            placeTypes: ['park', 'spa', 'gym']
        },
        { 
            id: '4', 
            text: 'Divertissement', 
            image: '/images/mascotte/fiesta.png',
            icon: '🎪',
            placeTypes: ['tourist_attraction', 'amusement_park', 'movie_theater']
        },
        { 
            id: '5', 
            text: 'Sport', 
            image: '/images/mascotte/joy_1.png',
            icon: '🚴‍♂️',
        },
        {
            id: '6',
            text: 'Je sais ce que je veux',
            image: '/images/mascotte/data.png',
            icon: '🎯',
        }
    ];

    // Gérer les paramètres URL pour la copie d'événement
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isCopy = searchParams.get('copy');
        
        if (isCopy === 'true') {
            // Pré-remplir les données depuis les paramètres URL avec TOUS les champs
            const copiedData: EventFormData = {
                title: searchParams.get('title') || '',
                startDate: searchParams.get('startDate') || '',
                endDate: searchParams.get('endDate') || '',
                startTime: searchParams.get('startTime') || '',
                endTime: searchParams.get('endTime') || '',
                maxPersons: searchParams.get('maxPersons') || '',
                costPerPerson: searchParams.get('costPerPerson') || '',
                city: searchParams.get('city') || '',
                maxDistance: searchParams.get('maxDistance') || '',
                placeName: searchParams.get('placeName') || undefined,
                placeAddress: searchParams.get('placeAddress') || undefined,
                recurring: searchParams.get('recurring') === 'true',
                duration: searchParams.get('duration') || '',
                recurringRate: searchParams.get('recurringRate') || ''
            };

            // Gérer le type d'activité si fourni
            const activityType = searchParams.get('activityType');
            if (activityType) {
                // Trouver l'ID du type d'événement correspondant
                const eventType = eventTypes.find(type => type.text === activityType);
                if (eventType) {
                    setSelectedEventType(eventType.id);
                }
            }

            setFormData(copiedData);
            // Passer automatiquement à l'étape 2 si on copie un événement
            setCurrentStep(2);
        }
    }, []);

    // Redirection si pas connecté
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    // Handlers pour chaque étape
    const handleEventTypeSelect = (id: string) => {
        setSelectedEventType(id);
    };

// Handler pour le formulaire
    const handleFormSubmit = (formData: { 
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
    }) => {
        setFormData(formData);
        setCurrentStep(3);
    };

    // Fonction pour passer à l'étape suivante
    const handleNext = async () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Dernière étape - créer l'événement en base de données
            if (!user || !formData) {
                alert("Erreur: utilisateur ou données manquantes");
                return;
            }

            // Récupérer les activités suggérées avant de créer l'événement (uniquement si ce n'est pas "Je sais ce que je veux")
            try {
                const selectedType = eventTypes.find(type => type.id === selectedEventType);
                if (selectedType && formData.city && selectedEventType !== '6') {
                    const placesResponse = await fetch('/api/places/nearby', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            city: formData.city,
                            placeTypes: selectedType.placeTypes,
                            radius: formData.maxDistance ? Number(formData.maxDistance) * 1000 : 5000
                        }),
                    });

                    if (placesResponse.ok) {
                        const placesData = await placesResponse.json();
                        setSuggestedActivities(placesData.places || []);
                    } else {
                        const errorData = await placesResponse.json().catch(() => ({}));
                        console.error('❌ Erreur lors de la récupération des activités:', {
                            status: placesResponse.status,
                            statusText: placesResponse.statusText,
                            error: errorData
                        });
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des activités:', error);
            }

            try {
                // Préparer les données pour l'API
                const eventData = {
                    ...formData,
                    // Envoyer les dates telles quelles (format YYYY-MM-DD)
                    startDate: formData.startDate || null,
                    endDate: formData.endDate || null,
                    // Envoyer les heures telles quelles (format HH:MM)
                    startTime: formData.startTime || null,
                    endTime: formData.endTime || null,
                    // Convertir les nombres
                    maxPersons: formData.maxPersons ? Number(formData.maxPersons) : null,
                    costPerPerson: formData.costPerPerson ? Number(formData.costPerPerson) : null,
                    maxDistance: formData.maxDistance ? Number(formData.maxDistance) : null,
                    // Champs récurrents
                    recurring: formData.recurring || false,
                    duration: formData.duration ? Number(formData.duration) : null,
                    recurringRate: formData.recurringRate || null,
                    // Ajouter type d'événement sélectionné depuis l'étape 1
                    activityType: eventTypes.find(type => type.id === selectedEventType)?.text || '',
                    // Ajouter état par défaut
                    state: 'pending',
                    // Les tags seront ajoutés plus tard, pour l'instant on se concentre sur les utilisateurs
                    tags: [], // Vide pour l'instant
                    // Ajouter l'utilisateur créateur
                    userId: user.id,
                    // Ajouter les utilisateurs invités
                    invitedUsers: selectedUserIds,
                };


                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData),
                });

                if (response.ok) {
                    const createdEvent = await response.json();
                    setCreatedEventId(createdEvent.id);
                    setIsModalOpen(true);
                } else {
                    const error = await response.json();
                    alert(error?.error || 'Erreur lors de la création de l\'événement');
                }
            } catch (error) {
                console.error('Erreur création événement:', error);
                alert('Erreur réseau ou serveur');
            }
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
                return selectedEventType !== '';
            case 2:
                return formData !== null;
            case 3:
                return selectedUserIds.length > 0; // Au moins un utilisateur sélectionné
            default:
                return false;
        }
    };

    // Handler pour sélectionner/désélectionner un utilisateur
    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            const alreadySelected = prev.includes(userId);
            return alreadySelected
                ? prev.filter(id => id !== userId)
                : [...prev, userId];
        });
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalButtonClick = () => {
        setIsModalOpen(false);
        if (createdEventId) {
            router.push(`/events/${createdEventId}`);
        } else {
            router.push('/home');
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Créez vos évènements personnalisés !
                        </h1>
                        <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                            Sélectionnez le type d’évènement correspondant
                        </h3>
                        <div className="w-full">
                            <EventTypeCards
                                cards={eventTypes}
                                selectedId={selectedEventType}
                                onCardSelect={handleEventTypeSelect}
                            />
                        </div>
                    </>
                );

            case 2:
                return (
                    <div className="w-full">
                        <EventForm
                            title="Créez vos évènements personnalisés !"
                            subtitle="Entrez les informations générales de l'événement"
                            buttonText="Continuer"
                            eventTypeId={selectedEventType}
                            initialData={formData || undefined}
                            onSubmit={handleFormSubmit}
                        />
                    </div>
                );

            case 3:
                return (
                    <UserSelectionStep
                        title="Créez vos évènements personnalisés !"
                        subtitle="Séléctionnez vos collaborateurs"
                        currentUserId={user?.id || ''}
                        selectedUserIds={selectedUserIds}
                        onUserToggle={handleUserToggle}
                    />
                );

            default:
                return null;
        }
    };

    // Affichage de chargement
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <section className="overflow-y-auto md:overflow-hidden pt-24 flex flex-col items-center gap-10 p-10">
                {/* Section gauche */}
                <div className="h-full w-full flex flex-col gap-6 items-start p-10">
                    <div>
                        <BackArrow onClick={handleBack} className="" />
                    </div>
                    
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
                    
                    {currentStep !== 2 && (
                        <div className='w-1/6'>
                            <MainButton
                                text={currentStep === 3 ? "Créer et inviter" : "Continuer"}
                                onClick={handleNext}
                                disabled={!canContinue()}
                                color="bg-[var(--color-text)] font-poppins text-body-large"
                            />
                        </div>
                    )}
                </div>
            </section>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onButtonClick={handleModalButtonClick}
                showSteppers={false}
                title="Événement créé avec succès !"
                text="Votre événement a été créé et est maintenant disponible."
                buttonText="Voir l'événement"
                stepContents={[{
                    title: "Félicitations !",
                    text: "Votre événement a été créé avec succès.",
                    buttonText: "Voir l'événement",
                    image: "/images/mascotte/joy.png",
                    imagePosition: 'center' as const
                }]}
            />
        </>
    );
};

export default CreateEventPage;