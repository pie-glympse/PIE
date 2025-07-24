"use client"
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import MainButton from '@/components/ui/MainButton';
import BackArrow from '../../components/ui/BackArrow';
import CategoryBtn from '@/components/ui/CategoryBtn';
import Modal from '@/components/layout/Modal';
import ChoiceLi from '@/components/ui/ChoiceLi';

const AnswerEventPage = () => {
    const router = useRouter();
    
    // État pour gérer l'étape actuelle
    const [currentStep, setCurrentStep] = useState(1);
    
    // État pour la modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // États pour chaque étape
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

    // Données pour chaque étape
    const categories = [
        'Technologie',
        'Design',
        'Marketing',
        'Finance',
        'Ressources Humaines',
        'Ventes',
        'Développement Personnel',
        'Santé et Bien-être',
        'Éducation',
        'Environnement',
        'Art et Culture',
        'Voyages',
        'Sports et Loisirs',
        'Entrepreneuriat',
        'Innovation',
        'Leadership',
        'Communication',
        'Gestion de Projet',
        'Stratégie',
        'Analyse de Données',
        'Intelligence Artificielle',
        'Blockchain',
        'Cybersécurité',
        'Développement Durable',
        'Économie Circulaire',
    ];

    const dates = [
        '11/03/2025',
        '12/03/2025',
        '13/03/2025',
        '14/03/2025',
        '15/03/2025',
        '18/03/2025',
        '19/03/2025',
        '20/03/2025',
        '21/03/2025',
        '22/03/2025',
        '25/03/2025',
        '26/03/2025',
        '27/03/2025',
        '28/03/2025',
        '29/03/2025',
    ];

    const preferences = [
        { id: '1', text: 'Halal' },
        { id: '2', text: 'Cacher' },
        { id: '3', text: 'Végétarienne' },
        { id: '4', text: 'Végan' },
        { id: '5', text: 'Sans gluten' },
        { id: '6', text: 'Sans Lactose' },
            // Accessibilité"
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

    // Fonction pour passer à l'étape suivante
    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Dernière étape - ouvrir la modal
            console.log('Données finales:', {
                categories: selectedCategories,
                dates: selectedDates,
                preferences: selectedPreferences
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
        // Fermer la modal et rediriger
        setIsModalOpen(false);
        router.push('/home'); // Remplacez par votre route
    };

    // Fonction pour obtenir le contenu de l'étape actuelle
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
                            Formulez vos Préférences pour NomEvent
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
                            Formulez vos Préférences pour NomEvent
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
                            Formulez vos Préférences pour NomEvent
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
                {/* Section gauche */}
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
                            text={currentStep === 3 ? "Finaliser" : "Continuer"}
                            onClick={handleNext}
                            disabled={!canContinue()}
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
                buttonText="Continuer"
                stepContents={[{
                    title: "Félicitations !",
                    text: "Vos préférences ont été enregistrées avec succès.",
                    buttonText: "Continuer",
                    image: "/images/mascotte/joy.png",
                    imagePosition: 'center' as const
                }]}
            />
        </>
    );
};

export default AnswerEventPage;