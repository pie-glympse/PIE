import Image from 'next/image';
import type { FC } from 'react';

const EventDocuments: FC = () => {
    return (
        <div 
            className="w-full h-full flex flex-col items-center justify-center rounded-lg border-dashed bg-transparent"
            style={{ 
                borderWidth: '5px',
                borderColor: '#FAFAFA'
            }}
        >
            {/* Bouton avec icône import */}
            <button className="px-4 py-2 bg-white text-[var(--color-grey-four)] text-body-large  font-poppins hover:opacity-90 transition-opacity border-2 border-[var(--color-grey-three)] hover:border-[var(--color-main)] flex items-center gap-2 mb-4" 
                style={{ borderRadius: '4px' }}>
                <Image
                    src="/icons/import.svg"
                    alt="Upload"
                    width={32}
                    height={32}
                    className="text-greyThree"
                    sizes="32px"
                />
                Upload
            </button>
            
            {/* Texte principal */}
            <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-2 text-center">
                Choisissez vos pièces jointes ou glissez-les ici
                <br />
                 Max 20 MB
            </p>
        </div>
    );
};

export default EventDocuments;