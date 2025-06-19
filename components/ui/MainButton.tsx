import React from 'react';

interface MainButtonProps {
    color: string;
    text: string;
    onClick?: () => void;
}

const MainButton: React.FC<MainButtonProps> = ({ color, text, onClick }) => (
    <button
        className={`
            ${color} 
            text-white 
            rounded-md
            px-5 
            py-2.5
            hover:cursor-pointer
        `}
        onClick={onClick}
        type="button"
    >
        {text}
    </button>
);

export default MainButton;