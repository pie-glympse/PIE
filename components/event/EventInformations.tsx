import React from 'react';
import Image from 'next/image';
import Map from '@/components/Map';

interface EventInformationsProps {
  event: {
    description?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    state?: string;
    maxPersons?: string;
    costPerPerson?: string;
    city?: string;
    tags: { id: string; name: string }[];
  };
}

const EventInformations = ({ event }: EventInformationsProps) => {
  const isConfirmed = event.state?.toLowerCase() === 'confirmed';

  // 🐛 Debug temporaire
  console.log("📊 EventInformations - Données reçues:", {
    state: event.state,
    isConfirmed,
    date: event.date,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime
  });

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

  // Formatter juste le jour et le mois pour les ranges
  const formatDateShort = (dateString: string) => {
    if (!dateString) return "Non définie";
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long'
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

  // Fonction pour obtenir le texte de la date selon l'état
  const getDateText = () => {
    if (isConfirmed) {
      // Si confirmé, chercher la date finale dans plusieurs champs possibles
      const finalDate = event.date || event.startDate;
      if (finalDate) {
        return formatDate(finalDate);
      }
    } else if (event.startDate && event.endDate) {
      // Si pas confirmé, afficher le range
      const startYear = new Date(event.startDate).getFullYear();
      const endYear = new Date(event.endDate).getFullYear();
      
      if (startYear === endYear) {
        // Même année, format court
        return `Du ${formatDateShort(event.startDate)} au ${formatDateShort(event.endDate)} ${endYear}`;
      } else {
        // Années différentes, format complet
        return `Du ${formatDate(event.startDate)} au ${formatDate(event.endDate)}`;
      }
    } else if (event.startDate) {
      // Seulement une date de début
      return `À partir du ${formatDate(event.startDate)}`;
    }
    return "Non définie";
  };

  // Fonction pour obtenir le texte de l'heure selon l'état
  const getTimeText = () => {
    if (isConfirmed) {
      // Si confirmé, essayer d'extraire l'heure de la date finale
      const finalDate = event.date || event.startDate;
      if (finalDate) {
        const finalTime = formatTime(finalDate);
        return finalTime !== "Non définie" ? `À ${finalTime}` : "Heure à confirmer";
      }
    } else if (event.startTime && event.endTime) {
      // Si pas confirmé, afficher le range d'heures
      const startTimeFormatted = formatTime(event.startTime);
      const endTimeFormatted = formatTime(event.endTime);
      
      if (startTimeFormatted !== "Non définie" && endTimeFormatted !== "Non définie") {
        return `Entre ${startTimeFormatted} et ${endTimeFormatted}`;
      }
    } else if (event.startTime) {
      // Seulement une heure de début
      const startTimeFormatted = formatTime(event.startTime);
      return startTimeFormatted !== "Non définie" ? `À partir de ${startTimeFormatted}` : "Non définie";
    }
    return "Non définie";
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
              {getDateText()}
            </p>
            {/* Indicateur visuel selon l'état */}
            {!isConfirmed && (event.startDate || event.endDate) && (
              <p style={{ fontSize: '12px' }} className="text-[var(--color-grey-three)] mt-1">
                
              </p>
            )}
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
              {getTimeText()}
            </p>
            {/* Indicateur visuel selon l'état */}
            {!isConfirmed && (event.startTime || event.endTime) && (
              <p style={{ fontSize: '12px' }} className="text-[var(--color-grey-three)] mt-1">
                
              </p>
            )}
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
              {event.city || "Lieu non défini"}
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

      {/* Section Map */}
      <div>
        <h3 className="text-body-large font-poppins mb-4 text-[var(--color-text)]">
          Localisation
        </h3>
        <div 
          className="w-full h-64 rounded overflow-hidden"
          style={{ backgroundColor: '#F4F4F4' }}
        >
          <Map address={event.city} />
        </div>
      </div>
    </div>
  );
};

export default EventInformations;