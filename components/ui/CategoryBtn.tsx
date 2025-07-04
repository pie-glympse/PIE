import React from 'react';
import Image from 'next/image';

interface CategoryBtnProps {
    text: string;
    isSelected?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    selectedIcon?: string; // Chemin vers le SVG
    isDate?: boolean; // Nouveau prop pour plus de padding
}

const CategoryBtn: React.FC<CategoryBtnProps> = ({
    text,
    isSelected = false,
    onClick,
    disabled = false,
    selectedIcon = '/icons/selected.svg', // Icône par défaut
    isDate = false // Par défaut false
}) => (
    <li
        className={`
            relative
            w-auto
            rounded-md
            border-2
            cursor-pointer
            transition-all
            duration-200
            font-poppins
            text-body-large
            text-[var(--color-grey-three)]
            ${isDate 
                ? 'px-20 py-2.5' // Plus de padding si isDate est true
                : 'px-4 py-2.5' // Padding normal
            }
            ${isSelected 
                ? 'border-[var(--color-main)] text-[var(--color-text)]' 
                : 'border-[var(--color-grey-two)] bg-white hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={disabled ? undefined : onClick}
    >
        {text}
                
        {/* SVG Icon - affiché uniquement si sélectionné */}
        {isSelected && (
            <div className="absolute -top-4 -right-4">
                <Image
                    src={selectedIcon}
                    alt="Selected"
                    width={32}
                    height={32}
                    className=""
                />
            </div>
        )}
    </li>
);

export default CategoryBtn;