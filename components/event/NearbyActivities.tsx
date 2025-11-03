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

  // Formes décoratives qui correspondent aux couleurs de l'app
  const decorativeShapes = [
    '/images/illustration/palm.svg',
    '/images/illustration/roundstar.svg',
    '/images/illustration/stack.svg',
  ];

  // Fonction pour obtenir une forme aléatoire de manière déterministe
  const getDecorativeShape = (index: number) => {
    return decorativeShapes[index % decorativeShapes.length];
  };

  return (
    <div className="py-8">
      <h3 className="text-h3 font-urbanist mb-6 text-[var(--color-text)]">
        Nos recommandations
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((place, index) => (
          <div
            key={place.id}
            className="relative rounded-xl border border-gray-200 p-6 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 bg-white"
            onClick={() => {
              // Ouvrir Google Maps dans un nouvel onglet
              window.open(`https://www.google.com/maps/place/?q=place_id:${place.id}`, '_blank');
            }}
          >
            {/* Contenu principal */}
            <div className="relative z-10">
              {/* Image et note */}
              <div className="flex items-start gap-3 mb-3">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {place.photos && place.photos.length > 0 ? (
                    <Image
                      src={place.photos[0].url}
                      alt={place.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Titre */}
                  <h4 className="text-lg font-semibold font-urbanist text-[var(--color-text)] mb-1 line-clamp-2">
                    {place.name}
                  </h4>
                  
                  {/* Note */}
                  {place.rating && (
                    <div className="flex items-center gap-1">
                      {renderStars(place.rating)}
                    </div>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <p className="text-sm text-[var(--color-grey-three)] font-poppins mb-3 line-clamp-2">
                {place.address}
              </p>

              {/* Prix et statut */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderPriceLevel(place.priceLevel)}
                  {place.userRatingsTotal && (
                    <span className="text-xs text-[var(--color-grey-three)]">
                      {place.userRatingsTotal} avis
                    </span>
                  )}
                </div>
                
                {/* Badge statut ouvert */}
                {place.openNow !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded-full font-poppins ${
                    place.openNow 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {place.openNow ? 'Ouvert' : 'Fermé'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Image d'arrière-plan décorative (style EventCard) */}
            <Image
              src={getDecorativeShape(index)}
              alt=""
              aria-hidden="true"
              className="absolute right-[-25px] bottom-[-25px] pointer-events-none opacity-30"
              width={120}
              height={120}
              style={{
                objectFit: "contain",
                zIndex: 1,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyActivities;

