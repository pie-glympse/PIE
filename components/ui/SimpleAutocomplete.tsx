// components/ui/SimpleAutocomplete.tsx
"use client";

import { useState, useRef, useCallback } from "react";

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

export default function SimpleAutocomplete({
  value,
  onChange,
  placeholder,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<any>(null);
  const hasRequestedLoad = useRef(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: "fr" },
      },
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        onChangeRef.current(place.formatted_address);
      } else if (place.name) {
        onChangeRef.current(place.name);
      }
    });

    setIsApiLoaded(true);
    setIsLoading(false);
  }, []);

  // Chargement paresseux : le script Google Maps (~1,3 Mo) n'est téléchargé qu'au
  // premier focus du champ, pas au montage. Évite de charger la lib sur les pages
  // où l'utilisateur ne touche jamais le champ adresse (register, create-event…).
  const loadGoogleMaps = useCallback(() => {
    if (hasRequestedLoad.current) return;
    hasRequestedLoad.current = true;

    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    setIsLoading(true);

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]',
    );
    if (window.googleMapsLoaded || existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          initAutocomplete();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps?.places) {
          setIsLoading(false);
          console.warn(
            "⚠️ Timeout: Google Maps API n'a pas chargé après 10 secondes",
          );
        }
      }, 10000);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setIsLoading(false);
      console.error(
        "❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY n'est pas définie dans les variables d'environnement",
      );
      return;
    }

    window.googleMapsLoaded = true;
    window.initAutocomplete = initAutocomplete;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setIsLoading(false);
      window.googleMapsLoaded = false;
      console.error("❌ Erreur lors du chargement de l'API Google Maps");
    };
    document.head.appendChild(script);
  }, [initAutocomplete]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={loadGoogleMaps}
        placeholder={placeholder || "Adresse complète"}
        className="w-full px-4 py-2.5 text-base font-poppins text-[var(--color-text)] bg-white border border-[var(--color-grey-two)] rounded-lg transition-colors placeholder:text-[var(--color-grey-three)] focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
        autoComplete="off"
      />

      {isLoading && !isApiLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
