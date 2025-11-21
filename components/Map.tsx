// components/Map.tsx
'use client';

import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useState, useEffect, useRef } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 48.8566, // Latitude de Paris par défaut
  lng: 2.3522,  // Longitude de Paris par défaut
};

interface PlaceMarker {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  address?: string; // Adresse optionnelle
  places?: PlaceMarker[]; // Liste des lieux recommandés à afficher
}

export default function GoogleMapComponent({ address, places = [] }: MapProps) {
  const [center, setCenter] = useState(defaultCenter);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const markerRefs = useRef<{ [key: string]: google.maps.Marker | null }>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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

  // Calculer le centre et les limites pour inclure tous les markers
  const calculateBounds = () => {
    if (places.length === 0) {
      return { center, zoom: 14 };
    }

    const allPoints = [
      center, // Point de l'événement
      ...places.map(place => place.location) // Points des lieux recommandés
    ];

    const lats = allPoints.map(p => p.lat);
    const lngs = allPoints.map(p => p.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Centre calculé
    const calculatedCenter = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    };

    // Calculer le zoom approximatif basé sur la distance
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 14;
    if (maxDiff > 0.1) zoom = 10;
    else if (maxDiff > 0.05) zoom = 11;
    else if (maxDiff > 0.02) zoom = 12;
    else if (maxDiff > 0.01) zoom = 13;
    else zoom = 14;

    return { center: calculatedCenter, zoom };
  };

  const mapBounds = calculateBounds();

  // Créer une icône de marker personnalisée avec la couleur de l'app (#FCC638)
  const createCustomMarkerIcon = () => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#FCC638',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8,
    };
  };

  // Fonction pour gérer le survol d'un marker
  const handleMarkerMouseOver = (place: PlaceMarker) => {
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({
        disableAutoPan: true, // Désactiver le recentrage automatique
        maxWidth: 180, // Limiter la largeur pour éviter le scroll
      });
    }
    
    const marker = markerRefs.current[place.id];
    if (marker) {
      // Construire le contenu HTML de la popup avec image plus petite
      const imageHtml = place.photoUrl 
        ? `<img src="${place.photoUrl}" alt="${place.name}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 4px; margin-bottom: 6px; display: block;" />`
        : '';
      
      const addressHtml = place.address 
        ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #666; line-height: 1.3;">${place.address}</p>`
        : '';
      
      const content = `
        <div style="padding: 0; max-width: 180px; overflow: hidden;">
          ${imageHtml}
          <h3 style="margin: 0; font-size: 13px; font-weight: 600; color: #333; line-height: 1.3;">${place.name}</h3>
          ${addressHtml}
        </div>
      `;
      
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.open({
        anchor: marker,
        map: marker.getMap() || undefined,
        shouldFocus: false, // Ne pas donner le focus pour éviter le recentrage
      });
    }
  };

  // Fonction pour gérer la fin du survol
  const handleMarkerMouseOut = () => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  };

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapBounds.center}
        zoom={mapBounds.zoom}
      >
        {/* Marker pour l'événement principal */}
        <Marker 
          position={center}
        />
        
        {/* Markers pour les lieux recommandés */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={place.location}
            icon={createCustomMarkerIcon()}
            onLoad={(marker) => {
              // Stocker la référence du marker
              markerRefs.current[place.id] = marker;
              
              // Ajouter les listeners pour le survol
              marker.addListener('mouseover', () => {
                handleMarkerMouseOver(place);
              });
              
              marker.addListener('mouseout', () => {
                handleMarkerMouseOut();
              });
            }}
            onUnmount={(marker) => {
              // Nettoyer les listeners et la référence
              if (marker) {
                google.maps.event.clearInstanceListeners(marker);
                delete markerRefs.current[place.id];
              }
            }}
          />
        ))}
      </GoogleMap>
      {isGeocoding && (
        <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs shadow">
          Localisation...
        </div>
      )}
    </div>
  );
}
