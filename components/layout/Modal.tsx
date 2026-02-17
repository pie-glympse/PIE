import MainButton from '../ui/MainButton';
import Image from 'next/image';

interface StepContent {
    title: string;
    text: string;
    buttonText?: string;
    image?: string;
    imagePosition?: 'center' | 'right';
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onButtonClick: () => void;
    showSteppers?: boolean;
    currentStep?: number;
    totalSteps?: number; // max 5
    // Props pour contenu dynamique
    stepContents?: StepContent[];
    // Props fallback pour usage simple
    title?: string;
    text?: string;
    buttonText?: string;
    // Textes personnalisés pour le bouton
    lastStepButtonText?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onButtonClick,
    showSteppers = false,
    currentStep = 1,
    totalSteps = 3,
    stepContents = [],
    title = '',
    text = '',
    buttonText = 'Continuer',
    lastStepButtonText = 'Terminer',
}) => {
    if (!isOpen) return null;

    // Limiter le nombre de steps à 5 maximum
    const validTotalSteps = Math.min(Math.max(totalSteps, 1), 5);
    const validCurrentStep = Math.min(Math.max(currentStep, 1), validTotalSteps);

    // Déterminer le contenu à afficher
    const getCurrentContent = () => {
        if (stepContents.length > 0 && stepContents[validCurrentStep - 1]) {
            return stepContents[validCurrentStep - 1];
        }
        return { title, text, buttonText };
    };

    const currentContent = getCurrentContent();
    const isLastStep = validCurrentStep === validTotalSteps;
    
    // Déterminer le texte du bouton
    const getButtonText = () => {
        if (currentContent.buttonText) {
            return currentContent.buttonText;
        }
        return isLastStep && showSteppers ? lastStepButtonText : buttonText;
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-4xl shadow-lg w-full max-w-xl p-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Top rounded div */}
                <div className={`w-full h-[279px] bg-[#E9F1FE] rounded-2xl flex items-end mb-4 ${
                    currentContent.imagePosition === 'right' ? 'justify-end pr-8' : 'justify-center'
                }`}>
                    {currentContent.image ? (
                        <Image 
                            src={currentContent.image}
                            alt={`Step ${validCurrentStep} illustration`}
                            width={266}
                            height={279}
                            className="object-contain"
                        />
                    ) : (
                        <div className="text-gray-400 text-lg">
                            Step {validCurrentStep}
                        </div>
                    )}
                </div>
                
                {/* Title div */}
                <div className="mb-2 text-center">
                    <h2 className="text-h2 font-poppins">{currentContent.title}</h2>
                </div>
                
                {/* Text div */}
                <div className="mb-6 text-center text-body-small font-poppins">{currentContent.text}</div>
                
                {/* Button div */}
                <div className="flex justify-center">
                    <MainButton 
                        color="bg-[var(--color-text)] font-poppins text-body-small" 
                        text={getButtonText()} 
                        onClick={onButtonClick} 
                    />
                </div>
                
                {/* Steppers - Conditionnel */}
                {showSteppers && (
                    <div className="flex justify-center mt-4 gap-2">
                        {Array.from({ length: validTotalSteps }, (_, index) => {
                            const stepNumber = index + 1;
                            const isCurrent = stepNumber === validCurrentStep;
                            
                            return (
                                <div
                                    key={stepNumber}
                                    className={`h-1 rounded-full transition-all duration-200 ${
                                        isCurrent 
                                            ? 'w-10 bg-[var(--color-main)]' // Step actuel 
                                            : 'w-6 bg-gray-300'   // Steps inactifs : plus étroits et gris
                                    }`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;