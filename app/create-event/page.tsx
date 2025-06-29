"use client"
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import MainButton from '@/components/ui/MainButton';
import BackArrow from '../../components/ui/BackArrow';
import Modal from '@/components/layout/Modal';
import { EventTypeCards } from '@/components/ui/EventTypeCard';
import EventForm from '@/components/forms/EventForm';

const CreateEventPage = () => {
    const router = useRouter();
    
    // État pour gérer l'étape actuelle (maintenant 3 étapes)
    const [currentStep, setCurrentStep] = useState(1);
    
    // État pour la modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // États pour chaque étape
    const [selectedEventType, setSelectedEventType] = useState<string>('');
    type EventFormData = {
        eventName: string;
        startTime: string;
        endTime: string;
        dateRange: string;
        maxBudgetPerPerson: string;
        city: string;
        maxDistance: string;
    };

    const [formData, setFormData] = useState<EventFormData | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<string>('');

    // Données pour chaque étape
    const eventTypes = [
        { id: '1', text: 'Conférence' },
        { id: '2', text: 'Atelier' },
        { id: '3', text: 'Séminaire' },
        { id: '4', text: 'Formation' },
        { id: '5', text: 'Webinaire' },
    ];

    const formats = [
        { id: '1', text: 'Présentiel' },
        { id: '2', text: 'Distanciel' },
        { id: '3', text: 'Hybride' },
        { id: '4', text: 'En ligne' },
        { id: '5', text: 'Sur site' },
    ];

    // Handlers pour chaque étape
    const handleEventTypeSelect = (id: string) => {
        setSelectedEventType(id);
    };

    const handleFormatSelect = (id: string) => {
        setSelectedFormat(id);
    };

// Handler pour le formulaire
    const handleFormSubmit = (formData: { 
        eventName: string; 
        startTime: string; 
        endTime: string; 
        dateRange: string; 
        maxBudgetPerPerson: string; 
        city: string; 
        maxDistance: string; 
    }) => {
        setFormData(formData);
        console.log('Données du formulaire:', formData);
        // Passer automatiquement à l'étape suivante après soumission du formulaire
        setCurrentStep(3);
    };

    // Fonction pour passer à l'étape suivante
    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Dernière étape - ouvrir la modal
            console.log('Données finales:', {
                eventType: selectedEventType,
                formData: formData,
                format: selectedFormat
            });
            setIsModalOpen(true);
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
                return selectedFormat !== '';
            default:
                return false;
        }
    };

    // Handlers pour la modal
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalButtonClick = () => {
        // Fermer la modal et rediriger
        setIsModalOpen(false);
        router.push('/events'); // Remplacez par votre route
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
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Finaliser votre Événement
                        </h1>
                        <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                            Quel format souhaitez-vous pour votre événement ?
                        </h3>
                        <div className="w-full">
                            <EventTypeCards
                                cards={formats}
                                selectedId={selectedFormat}
                                onCardSelect={handleFormatSelect}
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
                {/* Section gauche */}
                <div className="h-full w-full flex flex-col gap-6 items-start p-10">
                    <p className='text-left'>LOGO ICI</p>
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
                                text={currentStep === 3 ? "Envoyez les liens" : "Continuer"}
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