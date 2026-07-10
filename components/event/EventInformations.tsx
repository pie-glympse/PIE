'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import NearbyActivities from '@/components/event/NearbyActivities';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded overflow-hidden bg-[var(--color-grey-one)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
    </div>
  ),
});

interface EventInformationsProps {
  event: {
    id?: string;
    description?: string;
    additionalInfo?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    state?: string;
    maxPersons?: string;
    costPerPerson?: string;
    city?: string;
    isSpecificPlace?: boolean;
    selectedGoogleTags?: { id: string; techName: string; displayName?: string | null }[];
    confirmedGoogleTag?: { id: string; techName: string; displayName?: string | null } | null;
    location?: {
      placeId?: string | null;
      name?: string | null;
      address?: string | null;
      websiteUrl?: string | null;
      rating?: number | null;
      userRatingsTotal?: number | null;
    } | null;
    maxDistance?: number;
    users?: {
      id: string;
      companyId?: string;
    }[];
  };
}

interface Place {
  id: string;
  name: string;
  address?: string;
  photos?: { url: string }[];
  location?: {
    lat: number;
    lng: number;
  };
}

const EventInformations = ({ event }: EventInformationsProps) => {
  const isConfirmed = event.state?.toLowerCase() === 'confirmed';
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  
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

  const getLocationText = () => {
    // Lieu retenu après vote / lieu précis : afficher le nom de l'établissement
    if (event.location?.name) return event.location.name;
    if (event.isSpecificPlace && event.city) {
      return event.city;
    }
    return event.city || "Lieu non défini";
  };

  const mapsUrl = event.location?.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${event.location.placeId}`
    : null;

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
            sizes="32px"
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
            sizes="32px"
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
            sizes="32px"
          />
          <div>
            <p style={{ fontSize: '15px' }} className="text-[var(--color-text)]">
              Lieu
            </p>
            <p style={{ fontSize: '18px' }} className="font-medium text-[var(--color-text)]">
              {getLocationText()}
            </p>
          </div>
        </div>
      </div>

      {/* Card du lieu retenu (après vote) ou lieu précis — site + Google Maps */}
      {event.location?.placeId && (
        <div className="rounded-xl border-2 border-[var(--color-main)] bg-[#F0F7FF] p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-body-small font-poppins text-[var(--color-main-text)] mb-1">
                Lieu retenu
              </p>
              <h3 className="text-h3 font-urbanist text-[var(--color-text)]">
                {event.location.name}
              </h3>
              {event.location.address && (
                <p className="text-body-small font-poppins text-[var(--color-grey-three)] mt-1">
                  {event.location.address}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {event.location.rating != null && (
                  <span className="text-body-small font-poppins text-[var(--color-text)]">
                    <span className="text-yellow-500">★</span>{" "}
                    {event.location.rating.toFixed(1)}
                    {event.location.userRatingsTotal != null && (
                      <span className="text-[var(--color-grey-three)]">
                        {" "}
                        ({event.location.userRatingsTotal} avis)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {event.location.websiteUrl && (
                <a
                  href={event.location.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md bg-[var(--color-main)] text-white text-body-small font-poppins text-center hover:opacity-90 transition-opacity"
                >
                  Voir le site
                </a>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md border-2 border-[var(--color-main)] text-[var(--color-main-text)] text-body-small font-poppins text-center hover:bg-white transition-colors"
                >
                  Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Description et Informations Supplémentaires */}
      <div className="grid grid-cols-2 gap-8">
        {/* Colonne gauche - Description */}
        <div>
          <h3 className="text-body-large font-poppins mb-4 text-[var(--color-text)]">
            Description
          </h3>
          <p className="text-bodyLarge font-poppins text-[var(--color-text)] leading-relaxed whitespace-pre-line">
            {event.description || "Aucune description disponible"}
          </p>
        </div>

        {/* Colonne droite - Informations Supplémentaires (saisies à la création) */}
        <div>
          <h3 className="text-body-large font-poppins mb-4 text-[var(--color-text)]">
            Informations complémentaires
          </h3>
          <p className="text-bodyLarge font-poppins text-[var(--color-text)] leading-relaxed whitespace-pre-line">
            {event.additionalInfo?.trim()
              ? event.additionalInfo
              : "Aucune information complémentaire."}
          </p>
        </div>
      </div>

      {/* Section Map */}
      <div>
        <h3 className="text-body-large font-poppins mb-4 text-[var(--color-text)]">
          Localisation
        </h3>
        <div
          className="w-full h-[600px] rounded overflow-hidden bg-[var(--color-grey-one)]"
        >
          <Map
            address={event.city}
            places={recommendedPlaces.map(place => ({
              id: place.id,
              name: place.name,
              address: place.address,
              photoUrl: place.photos && place.photos.length > 0 ? place.photos[0].url : undefined,
              location: place.location!
            }))}
          />
        </div>
      </div>

      {/* Recommandations legacy : uniquement si aucun lieu n'a été choisi
          (le nouveau flux fixe le lieu via la clôture des votes) */}
      {!event.location?.placeId && (
        <NearbyActivities
          city={event.city}
          maxDistance={event.maxDistance || 5}
          eventId={event.id}
          companyId={event.users?.[0]?.companyId?.toString()}
          eventState={event.state}
        />
      )}
    </div>
  );
};

export default EventInformations;