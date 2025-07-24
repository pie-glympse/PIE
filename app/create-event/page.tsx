"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'
import MainButton from '@/components/ui/MainButton';
import BackArrow from '../../components/ui/BackArrow';
import Modal from '@/components/layout/Modal';
import { EventTypeCards } from '@/components/ui/EventTypeCard';
import EventForm from '@/components/forms/EventForm';
import { UserSelectionStep } from '@/components/forms/UserSelectionStep';
import { useUser } from '@/context/UserContext';

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
    };

    const [formData, setFormData] = useState<EventFormData | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Redirection si pas connecté
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    // Données pour chaque étape
    const eventTypes = [
        { id: '1', text: 'Conférence' },
        { id: '2', text: 'Atelier' },
        { id: '3', text: 'Séminaire' },
        { id: '4', text: 'Formation' },
        { id: '5', text: 'Webinaire' },
    ];

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
    }) => {
        setFormData(formData);
        console.log('Données du formulaire:', formData);
        // Passer automatiquement à l'étape suivante après soumission du formulaire
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

                console.log('Création événement:', eventData);

                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData),
                });

                if (response.ok) {
                    const createdEvent = await response.json();
                    console.log('Événement créé:', createdEvent);
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

    // Handlers pour la modal
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalButtonClick = () => {
        // Fermer la modal et rediriger vers la page d'accueil
        setIsModalOpen(false);
        router.push('/home'); 
    };

    // Fonction pour obtenir le contenu de l'étape actuelle
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Créer un Nouvel Événement
                        </h1>
                        <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                            Quel type d&#39;événement souhaitez-vous créer ?
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
                            title="Détails de votre Événement"
                            subtitle="Remplissez les informations pour créer votre événement"
                            buttonText="Continuer"
                            onSubmit={handleFormSubmit}
                        />
                    </div>
                );

            case 3:
                return (
                    <UserSelectionStep
                        title="Inviter des Participants"
                        subtitle="Sélectionnez les utilisateurs que vous souhaitez inviter à cet événement"
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
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    // Redirection si pas connecté (ne devrait pas arriver grâce à useEffect)
    if (!user) {
        return null;
    }

    return (
        <>
            <section className="flex flex-row h-screen items-center gap-10 p-10">
                {/* Section gauche */}
                <div className="h-full w-full flex flex-col gap-6 items-start p-10">
                    <div>
                        <BackArrow onClick={handleBack} className="" />
                    </div>
                    
                    {/* Indicateur d'étape - maintenant 3 étapes */}
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
                    
                    {/* Bouton en bas - caché à l'étape 2 car EventForm a son propre bouton */}
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

            {/* Modal simplifiée */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onButtonClick={handleModalButtonClick}
                showSteppers={false}
                title="Événement créé avec succès !"
                text="Votre événement a été créé et est maintenant disponible."
                buttonText="Voir mes événements"
            />
        </>
    );
};

export default CreateEventPage;