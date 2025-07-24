// components/ui/SimpleAutocomplete.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
    googleMapsLoaded: boolean;
  }
}

export default function SimpleAutocomplete({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    // Fonction pour initialiser l'autocomplete
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;

      // Éviter de créer plusieurs instances
      if (autocompleteRef.current) {
        return;
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'], // Pour des adresses complètes
        componentRestrictions: { country: 'fr' },
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
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
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Un script existe déjà, attendre qu'il se charge
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          initAutocomplete();
        }
      }, 100);
      return;
    }

    // Marquer qu'on est en train de charger
    window.googleMapsLoaded = true;

    // Charger l'API Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAutocomplete`;
    script.async = true;
    script.defer = true;
    
    window.initAutocomplete = initAutocomplete;
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

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
