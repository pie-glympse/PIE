'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';

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
  website?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface NearbyActivitiesProps {
  city?: string;
  activityType?: string;
  maxDistance?: number;
  eventId?: string;
  companyId?: string;
  eventState?: string; // État de l'événement (pending, confirmed, planned)
  onPlacesLoaded?: (places: Place[]) => void;
}

// Mapping des types d'événements vers les types Google Places
const getPlaceTypesFromActivityType = (activityType?: string): string[] => {
  const mapping: Record<string, string[]> = {
    'Gastronomie': ['restaurant', 'cafe', 'bar'],
    'Culture': ['museum', 'art_gallery', 'theater'],
    'Nature & Bien-être': ['park', 'spa', 'gym'],
    'Divertissement': ['tourist_attraction', 'amusement_park', 'movie_theater'],
    'Sport': ['arena', 'athletic_field', 'fishing_charter', 'fishing_pond', 'fitness_center', 'golf_course', 'gym', 'ice_skating_rink', 'playground', 'ski_resort', 'sports_activity_location', 'sports_club', 'sports_coaching', 'sports_complex', 'stadium', 'swimming_pool'],
  };

  return mapping[activityType || ''] || ['tourist_attraction'];
};

const NearbyActivities = ({ city, activityType, maxDistance = 5, eventId, companyId, eventState, onPlacesLoaded }: NearbyActivitiesProps) => {
  const { user } = useUser();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const [votedGoogleMapsTags, setVotedGoogleMapsTags] = useState<string[]>([]);
  
  // Utiliser useRef pour stocker la dernière valeur de blacklistedPlaceIds
  // pour éviter les re-renders infinis
  const blacklistedPlaceIdsRef = useRef<Set<string>>(new Set());
  
  // Callback stable pour onPlacesLoaded
  const onPlacesLoadedRef = useRef(onPlacesLoaded);
  useEffect(() => {
    onPlacesLoadedRef.current = onPlacesLoaded;
  }, [onPlacesLoaded]);

  // Récupérer les tags Google Maps stockés dans l'événement si confirmé
  useEffect(() => {
    // ✅ Ne récupérer les tags QUE si l'événement est confirmé
    if (!eventId || eventState?.toLowerCase() !== 'confirmed') {
      setVotedGoogleMapsTags([]);
      return;
    }

    const fetchEventData = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (response.ok) {
          const data = await response.json();
          const event = data.event || data;
          // Utiliser les tags stockés dans l'événement au moment du passage à "confirmed"
          if (event.confirmedGoogleMapsTags && Array.isArray(event.confirmedGoogleMapsTags)) {
            setVotedGoogleMapsTags(event.confirmedGoogleMapsTags);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des tags Google Maps:', err);
      }
    };

    fetchEventData();
  }, [eventId, eventState]);

  // Récupérer les lieux blacklistés
  useEffect(() => {
    const fetchBlacklistedPlaces = async () => {
      if (!companyId) return;

      try {
        const url = `/api/blacklisted-places?companyId=${companyId}${eventId ? `&eventId=${eventId}` : ''}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json() as Array<{ placeId: string }>;
          const blacklistedIds = new Set<string>(data.map((item) => item.placeId));
          blacklistedPlaceIdsRef.current = blacklistedIds;
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la blacklist:', err);
      }
    };

    fetchBlacklistedPlaces();
  }, [companyId, eventId]);

  // Récupérer les lieux recommandés - UNIQUEMENT si l'événement est confirmé
  useEffect(() => {
    // ✅ Vérification stricte : ne rien faire si l'événement n'est pas confirmé
    if (!city || eventState?.toLowerCase() !== 'confirmed') {
      setLoading(false);
      setPlaces([]); // S'assurer qu'il n'y a pas de lieux affichés
      return;
    }

    const fetchPlaces = async () => {
      try {
        // Utiliser les tags Google Maps stockés dans l'événement
        let placeTypes: string[];
        
        if (votedGoogleMapsTags.length > 0) {
          // Utiliser les tags Google Maps les plus votés stockés au passage à "confirmed"
          placeTypes = votedGoogleMapsTags;
        } else {
          // Fallback sur activityType si pas de tags stockés
          placeTypes = getPlaceTypesFromActivityType(activityType);
        }


        const response = await fetch('/api/places/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city,
            placeTypes,
            radius: maxDistance * 1000, // Convertir km en mètres
            eventId: eventId // Passer l'eventId pour les logs
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Filtrer les lieux blacklistés en utilisant le ref
          const filteredPlaces = (data.places || []).filter(
            (place: Place) => !blacklistedPlaceIdsRef.current.has(place.id)
          );
          setPlaces(filteredPlaces);
          // Notifier le parent que les lieux sont chargés
          if (onPlacesLoadedRef.current) {
            onPlacesLoadedRef.current(filteredPlaces);
          }
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
    // Ne pas inclure blacklistedPlaceIds et onPlacesLoaded dans les dépendances
    // pour éviter les boucles infinies
  }, [city, activityType, maxDistance, eventState, votedGoogleMapsTags, eventId]);

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

  // Fonction pour obtenir le niveau de prix (comme Google Maps)
  const renderPriceLevel = (priceLevel?: number | null) => {
    // Si priceLevel est null, undefined, ou 0, ne rien afficher (pas de message "non disponible")
    if (!priceLevel || priceLevel === 0) {
      return (<span className="text-sm text-[var(--color-grey-three)] font-poppins">
        Prix non disponible
      </span>);
    }
    
    // Google Maps utilise 0-4 pour les niveaux de prix
    // 1 = € (économique), 2 = €€ (modéré), 3 = €€€ (cher), 4 = €€€€ (très cher)
    const priceLabels: Record<number, string> = {
      1: '€',
      2: '€€',
      3: '€€€',
      4: '€€€€',
    };
    
    return (
      <span className="text-sm text-[var(--color-grey-three)] font-poppins">
        {priceLabels[priceLevel] || '€'.repeat(priceLevel)}
      </span>
    );
  };

  if (!city) return null;

  // Afficher un message si l'événement n'est pas confirmé
  if (eventState?.toLowerCase() !== 'confirmed') {
    return (
      <div className="py-8">
        <h3 className="text-h3 font-urbanist mb-6 text-[var(--color-text)]">
          Nos recommandations
        </h3>
        <div className="flex items-center justify-center py-12">
          <p className="text-[var(--color-grey-three)] text-center font-poppins">
            En attente des préférences
          </p>
        </div>
      </div>
    );
  }

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

  // Gérer l'ouverture de la modal de blacklist
  const handleBlacklistClick = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation(); // Empêcher le clic sur la card
    setSelectedPlace(place);
    setShowBlacklistModal(true);
  };

  // Blacklister un lieu
  const handleBlacklist = async (forAllEvents: boolean) => {
    if (!selectedPlace || !companyId || !user) {
      return;
    }

    setIsBlacklisting(true);
    try {
      const response = await fetch('/api/blacklisted-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: selectedPlace.id,
          companyId: companyId,
          eventId: forAllEvents ? null : eventId,
          createdById: user.id,
        }),
      });

      if (response.ok) {
        // Retirer le lieu de la liste immédiatement
        setPlaces(prev => prev.filter(p => p.id !== selectedPlace.id));
        // Mettre à jour le ref pour éviter les re-renders
        blacklistedPlaceIdsRef.current.add(selectedPlace.id);
        setShowBlacklistModal(false);
        setSelectedPlace(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la blacklist');
      }
    } catch (err) {
      console.error('Erreur lors de la blacklist:', err);
      alert('Erreur lors de la blacklist');
    } finally {
      setIsBlacklisting(false);
    }
  };

  // Fonction pour tracker les clics sur les liens de réservation
  const trackBookingClick = (venueId: string, eventId?: string, companyId?: string) => {
    // Événement analytics
    const analyticsEvent = {
      event: 'click_booking_link',
      venueId,
      eventId: eventId || null,
      companyId: companyId || null,
      partner: 'google_maps',
      timestamp: new Date().toISOString(),
    };

    // Log dans la console (peut être remplacé par un service analytics)

    // Si vous utilisez Google Analytics ou un autre service, ajoutez-le ici
    // Exemple avec gtag:
    // if (typeof window !== 'undefined' && (window as any).gtag) {
    //   (window as any).gtag('event', 'click_booking_link', {
    //     venue_id: venueId,
    //     event_id: eventId,
    //     company_id: companyId,
    //     partner: 'google_maps',
    //   });
    // }

    // Optionnel: Envoyer à votre API backend pour tracking
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(analyticsEvent),
    // }).catch(err => console.error('Erreur tracking analytics:', err));
  };

  // Construire l'URL de réservation (site web du lieu ou Google Maps en fallback)
  const handleBookingClick = (place: Place): string => {
    // Si le site web du lieu est disponible, l'utiliser avec paramètres UTM
    if (place.website) {
      try {
        // S'assurer que l'URL a un protocole
        let websiteUrl = place.website;
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
          websiteUrl = `https://${websiteUrl}`;
        }
        
        const url = new URL(websiteUrl);
        url.searchParams.set('utm_source', 'glimpse');
        url.searchParams.set('utm_medium', 'recommendation');
        url.searchParams.set('utm_campaign', 'booking');
        if (eventId) url.searchParams.set('eventId', eventId);
        if (companyId) url.searchParams.set('companyId', companyId);
        return url.toString();
      } catch (error) {
        console.error('Erreur construction URL website:', error);
        // Fallback sur Google Maps si l'URL est invalide
      }
    }

    // Sinon, utiliser Google Maps avec paramètres UTM et query params
    const params = new URLSearchParams({
      q: `place_id:${place.id}`,
      // Paramètres UTM pour le tracking
      utm_source: 'glimpse',
      utm_medium: 'recommendation',
      utm_campaign: 'booking',
      // Paramètres internes
      src: 'glimpse',
      ...(eventId && { eventId }),
      ...(companyId && { companyId }),
    });

    return `https://www.google.com/maps/place/?${params.toString()}`;
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
            {/* Icône croix pour blacklister (coin supérieur droit) */}
            {user && companyId && (
              <button
                onClick={(e) => handleBlacklistClick(e, place)}
                className="absolute top-3 right-3 z-20 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                aria-label="Blacklister ce lieu"
                title="Blacklister ce lieu"
              >
                <svg 
                  className="w-4 h-4 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            )}

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Niveau de prix (comme Google Maps) - affiché seulement si disponible */}
                  {renderPriceLevel(place.priceLevel) && (
                    <div className="flex items-center gap-1">
                      {renderPriceLevel(place.priceLevel)}
                    </div>
                  )}
                  
                  {/* Nombre d'avis */}
                  {place.userRatingsTotal && (
                    <span className="text-xs text-[var(--color-grey-three)] font-poppins">
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

              {/* Lien Voir le site */}
              <a
                href={handleBookingClick(place)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation(); // Empêcher l'ouverture de Google Maps
                  trackBookingClick(place.id, eventId || undefined, companyId || undefined);
                }}
                className="block mt-2 text-sm text-[var(--color-main)] hover:text-[var(--color-main)]/80 underline font-poppins"
              >
                Voir le site
              </a>
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

      {/* Modal de confirmation de blacklist */}
      {showBlacklistModal && selectedPlace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold font-urbanist text-[var(--color-text)] mb-4">
              Blacklister ce lieu ?
            </h3>
            <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-6">
              Souhaitez-vous exclure <strong>{selectedPlace.name}</strong> des recommandations ?
            </p>
            
            <div className="space-y-3">
              {/* Bouton: Pour cet événement uniquement */}
              {eventId && (
                <button
                  onClick={() => handleBlacklist(false)}
                  disabled={isBlacklisting}
                  className="w-full px-6 py-3 bg-[var(--color-main)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-poppins font-medium"
                >
                  {isBlacklisting ? 'Blacklist en cours...' : 'Pour cet événement uniquement'}
                </button>
              )}
              
              {/* Bouton: Pour tous les événements */}
              <button
                onClick={() => handleBlacklist(true)}
                disabled={isBlacklisting}
                className="w-full px-6 py-3 bg-[var(--color-secondary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-poppins font-medium"
              >
                {isBlacklisting ? 'Blacklist en cours...' : 'Pour tous les événements'}
              </button>
              
              {/* Bouton Annuler */}
              <button
                onClick={() => {
                  setShowBlacklistModal(false);
                  setSelectedPlace(null);
                }}
                disabled={isBlacklisting}
                className="w-full px-6 py-3 text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition font-poppins"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyActivities;

