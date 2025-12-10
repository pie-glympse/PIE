import React from 'react';
import Image from 'next/image';

interface EventTypeCardProps {
    text: string;
    isSelected?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    selectedIcon?: string;
    image?: string;
}

const EventTypeCard: React.FC<EventTypeCardProps> = ({
    text,
    isSelected = false,
    onClick,
    disabled = false,
    selectedIcon = '/icons/selected.svg',
    image = '/images/mascotte/base.png'
}) => (
    <li
        className={`
            relative
            w-auto
            rounded-lg
            border-2
            cursor-pointer
            transition-all
            duration-200
            p-4
            bg-white
            text-gray-500
            ${isSelected
                ? 'border-[var(--color-main)] border-[3px]'
                : 'border-[var(--color-grey-two)] hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={disabled ? undefined : onClick}
    >
        <div className="flex flex-col h-full">
            {/* Section du haut avec image */}
            <div className="h-44 bg-[#E9F1FE] rounded-md flex items-end justify-start">
                <Image
                    src={image}
                    alt={text}
                    width={200}
                    height={200}
                    className="object-contain w-full h-full"
                />
            </div>

            {/* Section texte du bas */}
            <div className="p-4 bg-white font-poppins text-body-large text-center text-[var(--color-text)]">
                {text}
            </div>
        </div>

        {/* SVG Icon - affiché uniquement si sélectionné */}
        {isSelected && (
            <div className="absolute -top-8 -right-6">
                <Image
                    src={selectedIcon}
                    alt="Selected"
                    width={56}
                    height={56}
                    className=""
                />
            </div>
        )}
    </li>
);

// Composant wrapper pour afficher plusieurs cards
interface EventTypeCardsProps {
    cards: Array<{
        id: string;
        text: string;
        image?: string;
    }>;
    selectedId?: string;
    onCardSelect?: (id: string) => void;
    disabled?: boolean;
    selectedIcon?: string;
}

export const EventTypeCards: React.FC<EventTypeCardsProps> = ({
    cards,
    selectedId,
    onCardSelect,
    disabled = false,
    selectedIcon = '/icons/selected.svg'
}) => (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
            <EventTypeCard
                key={card.id}
                text={card.text}
                image={card.image}
                isSelected={selectedId === card.id}
                onClick={() => onCardSelect?.(card.id)}
                disabled={disabled}
                selectedIcon={selectedIcon}
            />
        ))}
    </ul>
);

export default EventTypeCard;