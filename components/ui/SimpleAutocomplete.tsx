// components/ui/SimpleAutocomplete.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

export type SelectedPlace = {
  placeId?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Recherche d'établissements (nom + adresse) au lieu d'adresses seules */
  searchPlaces?: boolean;
  /** Callback avec le lieu structuré (place_id, coordonnées…) quand un choix est fait */
  onPlaceSelected?: (place: SelectedPlace) => void;
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
    googleMapsLoaded: boolean;
  }
}

export default function SimpleAutocomplete({
  value,
  onChange,
  placeholder,
  searchPlaces = false,
  onPlaceSelected,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteRef = useRef<any>(null);
  // Ref pour toujours appeler la dernière version du callback (listener attaché une seule fois)
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  onPlaceSelectedRef.current = onPlaceSelected;

  useEffect(() => {
    // Fonction pour initialiser l'autocomplete
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;

      // Éviter de créer plusieurs instances
      if (autocompleteRef.current) {
        return;
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: searchPlaces ? ['establishment'] : ['geocode'],
        componentRestrictions: { country: 'fr' },
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
        onPlaceSelectedRef.current?.({
          placeId: place.place_id || undefined,
          name: place.name || undefined,
          address: place.formatted_address || undefined,
          lat: place.geometry?.location?.lat?.() ?? undefined,
          lng: place.geometry?.location?.lng?.() ?? undefined,
        });
      });

      setIsApiLoaded(true);
    };

    // Vérifier si l'API est déjà chargée
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    // Vérifier si on est déjà en train de charger l'API
    if (window.googleMapsLoaded) {
      return;
    }

    // Éviter de charger l'API plusieurs fois
    // Vérifier si un script Google Maps existe déjà (chargé par useLoadScript ou autre)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Un script existe déjà, attendre qu'il se charge
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          initAutocomplete();
        }
      }, 100);
      
      // Timeout après 10 secondes pour éviter une boucle infinie
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps?.places) {
          console.warn('⚠️ Timeout: Google Maps API n\'a pas chargé après 10 secondes');
        }
      }, 10000);
      
      return;
    }

    // Marquer qu'on est en train de charger
    window.googleMapsLoaded = true;

    // Vérifier que la clé API est définie
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY n\'est pas définie dans les variables d\'environnement');
      return;
    }

    // Charger l'API Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
    script.async = true;
    script.defer = true;
    
    // Gérer les erreurs de chargement
    script.onerror = () => {
      console.error('❌ Erreur lors du chargement de l\'API Google Maps');
      console.error('Vérifiez que la clé API est valide et que les APIs suivantes sont activées :');
      console.error('- Maps JavaScript API');
      console.error('- Places API');
      window.googleMapsLoaded = false;
    };
    
    window.initAutocomplete = initAutocomplete;
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, searchPlaces]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Adresse complète'}
        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
        autoComplete="off"
      />
      
      {!isApiLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
