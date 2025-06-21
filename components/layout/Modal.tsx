import React from 'react';
import MainButton from '../ui/MainButton';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    buttonText: string;
    onButtonClick: () => void;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    text,
    buttonText,
    onButtonClick,
}) => {
    if (!isOpen) return null;

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
                <div className="w-full h-[279px] bg-[#E9F1FE] rounded-2xl flex items-center justify-center mb-4" />
                
                {/* Title div */}
                <div className="mb-2 text-center">
                    <h2 className="text-h2 font-poppins">{title}</h2>
                </div>
                
                {/* Text div */}
                <div className="mb-6 text-center text-body-small font-poppins">{text}</div>
                
                {/* Button div */}
                <div className="flex justify-center">
                    <MainButton color="bg-[var(--color-text)] font-poppins text-body-small" text={buttonText} onClick={onButtonClick} />
                </div>
            </div>
        </div>
    );
};

export default Modal;