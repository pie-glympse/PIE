// components/Map.tsx
'use client';

import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 48.8566, // Latitude de Paris par défaut
  lng: 2.3522,  // Longitude de Paris par défaut
};

interface MapProps {
  address?: string; // Adresse optionnelle
}

export default function GoogleMapComponent({ address }: MapProps) {
  const [center, setCenter] = useState(defaultCenter);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // Fonction pour convertir une adresse en coordonnées avec l'API Web
  const geocodeWithWebAPI = async (address: string) => {
    if (!address) return;

    setIsGeocoding(true);
    try {
      // Utiliser l'API REST Geocoding au lieu de l'API JavaScript
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        const location = data.results[0].geometry.location;
        setCenter({
          lat: location.lat,
          lng: location.lng
        });
      } else {
        console.error('Geocoding failed:', data.status);
        // Garder le centre par défaut en cas d'erreur
      }
    } catch (error) {
      console.error('Erreur lors du geocoding:', error);
    }
    setIsGeocoding(false);
  };

  // Effect pour géocoder l'adresse quand elle change
  useEffect(() => {
    if (address && isLoaded) {
      geocodeWithWebAPI(address);
    }
  }, [address, isLoaded]);

  if (loadError) {
    return <div>Erreur de chargement de la carte</div>;
  }

  if (!isLoaded) {
    return <div>Chargement de la carte...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14} // Zoom un peu plus proche pour voir l'adresse
      >
        <Marker position={center} />
      </GoogleMap>
      {isGeocoding && (
        <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs shadow">
          Localisation...
        </div>
      )}
    </div>
  );
}
