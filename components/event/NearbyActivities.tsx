'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Place {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  placeType: string;
  photos: { url: string }[];
  priceLevel?: number;
  openNow?: boolean;
}

interface NearbyActivitiesProps {
  city?: string;
  activityType?: string;
  maxDistance?: number;
}

// Mapping des types d'événements vers les types Google Places
const getPlaceTypesFromActivityType = (activityType?: string): string[] => {
  const mapping: Record<string, string[]> = {
    'Gastronomie': ['restaurant', 'cafe', 'bar'],
    'Culture': ['museum', 'art_gallery', 'theater'],
    'Nature & Bien-être': ['park', 'spa', 'gym'],
    'Divertissement': ['tourist_attraction', 'amusement_park', 'movie_theater'],
    'Shopping': ['shopping_mall', 'store'],
  };

  return mapping[activityType || ''] || ['tourist_attraction'];
};

const NearbyActivities = ({ city, activityType, maxDistance = 5 }: NearbyActivitiesProps) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!city) {
        setLoading(false);
        return;
      }

      try {
        const placeTypes = getPlaceTypesFromActivityType(activityType);
        const response = await fetch('/api/places/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city,
            placeTypes,
            radius: maxDistance * 1000 // Convertir km en mètres
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPlaces(data.places || []);
        } else {
          setError('Impossible de charger les recommandations');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des lieux:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [city, activityType, maxDistance]);

  // Fonction pour obtenir les étoiles
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-500">
            {i < fullStars ? '★' : i === fullStars && hasHalfStar ? '½' : '☆'}
          </span>
        ))}
        <span className="text-sm text-[var(--color-grey-three)] ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Fonction pour obtenir le niveau de prix
  const renderPriceLevel = (priceLevel?: number) => {
    if (!priceLevel) return null;
    return (
      <span className="text-[var(--color-grey-three)] text-sm">
        {'€'.repeat(priceLevel)}
      </span>
    );
  };

  if (!city) return null;

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-h3 font-urbanist mb-6 text-[var(--color-text)]">
          Nos recommandations
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <h3 className="text-h3 font-urbanist mb-6 text-[var(--color-text)]">
          Nos recommandations
        </h3>
        <p className="text-[var(--color-grey-three)] text-center py-8">{error}</p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="py-8">
        <h3 className="text-h3 font-urbanist mb-6 text-[var(--color-text)]">
          Nos recommandations
        </h3>
        <p className="text-[var(--color-grey-three)] text-center py-8">
          Aucune recommandation disponible pour cette zone
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h3 className="text-h3 font-urbanist mb-6 text-[var(--color-text)]">
        Nos recommandations
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {places.map((place) => (
          <div
            key={place.id}
            className="flex gap-4 p-4 rounded-lg bg-[#F4F4F4] hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              // Ouvrir Google Maps dans un nouvel onglet
              window.open(`https://www.google.com/maps/place/?q=place_id:${place.id}`, '_blank');
            }}
          >
            {/* Image à gauche */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-300">
              {place.photos && place.photos.length > 0 ? (
                <Image
                  src={place.photos[0].url}
                  alt={place.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Informations à droite */}
            <div className="flex-1 min-w-0">
              {/* Titre */}
              <h4 className="text-body-large font-semibold font-poppins text-[var(--color-text)] truncate mb-1">
                {place.name}
              </h4>
              
              {/* Adresse */}
              <p className="text-sm text-[var(--color-grey-three)] font-poppins truncate mb-2">
                {place.address}
              </p>

              {/* Note et Prix */}
              <div className="flex items-center gap-3">
                {renderStars(place.rating)}
                {place.userRatingsTotal && (
                  <span className="text-xs text-[var(--color-grey-three)]">
                    ({place.userRatingsTotal})
                  </span>
                )}
                {renderPriceLevel(place.priceLevel)}
              </div>

              {/* Badge statut ouvert */}
              {place.openNow !== undefined && (
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    place.openNow 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {place.openNow ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyActivities;

