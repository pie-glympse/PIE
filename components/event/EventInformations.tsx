import React from 'react';
import Image from 'next/image';

interface EventInformationsProps {
  event: {
    description?: string;
    date?: string;
    maxPersons?: string;
    costPerPerson?: string;
    tags: { id: string; name: string }[];
  };
}

const EventInformations = ({ event }: EventInformationsProps) => {
  // Formatter la date en français
  const formatDate = (dateString: string) => {
    if (!dateString) return "Non définie";
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('fr-FR', options);
  };

  // Formatter l'heure
  const formatTime = (dateString: string) => {
    if (!dateString) return "Non définie";
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-8">
      {/* Section des 3 cards en haut */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card Date */}
        <div 
          className="flex items-center gap-3 p-4 rounded"
          style={{ backgroundColor: '#F4F4F4', borderRadius: '5px' }}
        >
          <Image
            src="/icons/calendar.svg"
            alt="Calendrier"
            width={32}
            height={32}
          />
          <div>
            <p style={{ fontSize: '15px' }} className="text-[var(--color-text)]">
              Date
            </p>
            <p style={{ fontSize: '18px' }} className="font-medium text-[var(--color-text)]">
              {formatDate(event.date || '')}
            </p>
          </div>
        </div>

        {/* Card Heure */}
        <div 
          className="flex items-center gap-3 p-4 rounded"
          style={{ backgroundColor: '#F4F4F4', borderRadius: '5px' }}
        >
          <Image
            src="/icons/clock.svg"
            alt="Horloge"
            width={32}
            height={32}
          />
          <div>
            <p style={{ fontSize: '15px' }} className="text-[var(--color-text)]">
              Heure
            </p>
            <p style={{ fontSize: '18px' }} className="font-medium text-[var(--color-text)]">
              {event.date ? `De ${formatTime(event.date)} à 22h30` : "Non définie"}
            </p>
          </div>
        </div>

        {/* Card Lieu */}
        <div 
          className="flex items-center gap-3 p-4 rounded"
          style={{ backgroundColor: '#F4F4F4', borderRadius: '5px' }}
        >
          <Image
            src="/icons/place.svg"
            alt="Localisation"
            width={32}
            height={32}
          />
          <div>
            <p style={{ fontSize: '15px' }} className="text-[var(--color-text)]">
              Lieu
            </p>
            <p style={{ fontSize: '18px' }} className="font-medium text-[var(--color-text)]">
              Vapiano de Clichy
            </p>
          </div>
        </div>
      </div>

      {/* Section Description et Informations Supplémentaires */}
      <div className="grid grid-cols-2 gap-8">
        {/* Colonne gauche - Description */}
        <div>
          <h3 className="text-body-large font-poppins mb-4 text-[var(--color-text)]">
            Description
          </h3>
          <p className="text-bodyLarge font-poppins text-[var(--color-text)] leading-relaxed">
            {event.description || "Aucune description disponible"}
          </p>
        </div>

        {/* Colonne droite - Informations Supplémentaires */}
        <div>
          <h3 className="text-body-large font-poppins mb-4 text-[var(--color-text)]">
            Informations Supplémentaires
          </h3>
          <p className="text-bodyLarge font-poppins text-[var(--color-text)] leading-relaxed">
            Le transport sera assuré par l'entreprise, à partir de 18h vous trouverez des cars qui vous attendront.
            <br />
            Pour le retour, des taxis seront mis à votre disposition si besoin.
          </p>
        </div>
      </div>

      {/* Placeholder pour la map */}
      <div>
        <div 
          className="w-full h-64 rounded flex items-center justify-center"
          style={{ backgroundColor: '#F4F4F4' }}
        >
          <p className="text-[var(--color-grey-three)]">Map à venir...</p>
        </div>
      </div>
    </div>
  );
};

export default EventInformations;