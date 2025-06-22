import React from 'react';

interface MainButtonProps {
    color: string;
    text: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

const MainButton: React.FC<MainButtonProps> = ({ 
    color, 
    text, 
    onClick, 
    type = 'button', // Par défaut button pour éviter les soumissions accidentelles
    disabled = false
}) => (
    <button
        className={`
            ${color} 
            text-white 
            rounded-md
            px-5 
            py-2.5
            w-full
            hover:cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={onClick}
        type={type}
        disabled={disabled}
    >
        {text}
    </button>
);

export default MainButton;