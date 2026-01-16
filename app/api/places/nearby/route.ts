import { NextResponse } from "next/server";

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  place_type?: string;
}

export async function POST(request: Request) {
  try {
    const { city, placeTypes, radius = 5000, eventId } = await request.json();


    if (!city) {
      return NextResponse.json({ error: "Ville manquante" }, { status: 400 });
    }

    if (!placeTypes || placeTypes.length === 0) {
      return NextResponse.json({ error: "Types de lieux manquants" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API Google manquante" }, { status: 500 });
    }

    // Étape 1: Geocoder la ville pour obtenir les coordonnées
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`
    );

    if (!geocodeResponse.ok) {
      return NextResponse.json({ error: "Erreur lors du geocoding" }, { status: 500 });
    }

    const geocodeData = await geocodeResponse.json();

    // Gérer les erreurs de geocoding
    if (geocodeData.status === 'REQUEST_DENIED') {
      console.error('❌ Geocoding API: REQUEST_DENIED');
      console.error('💡 Vérifiez que la Geocoding API est activée dans Google Cloud Console');
      return NextResponse.json({ 
        error: "Geocoding API non autorisée. Vérifiez la configuration de la clé API." 
      }, { status: 403 });
    }

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      console.error('Geocoding failed:', geocodeData.status, geocodeData.error_message);
      return NextResponse.json({ 
        error: `Ville introuvable: ${geocodeData.status}`,
        details: geocodeData.error_message 
      }, { status: 404 });
    }

    const location = geocodeData.results[0].geometry.location;
    const lat = location.lat;
    const lng = location.lng;

    // Étape 2: Rechercher les lieux à proximité pour chaque type
    const allPlaces: GooglePlace[] = [];
    const seenPlaceIds = new Set<string>();

    for (const type of placeTypes) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
      
      const placesResponse = await fetch(url);

      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        
        if (placesData.status === 'OK' && placesData.results) {
          // Ajouter les résultats avec le type, en évitant les doublons
          for (const place of placesData.results) {
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
              allPlaces.push({
                ...place,
                place_type: type
              });
            }
          }
        }
      }
    }

    // Limiter à 20 résultats les plus populaires (par nombre d'avis)
    const sortedPlaces = allPlaces
      .sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))
      .slice(0, 20);


    // Récupérer les détails complets (incluant website) pour chaque lieu
    // Note: Cela nécessite des appels API supplémentaires mais permet d'obtenir le website
    const placesWithDetails = await Promise.all(
      sortedPlaces.map(async (place) => {
        try {
          // Appel Place Details pour obtenir le website
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?` +
            `place_id=${place.place_id}&fields=website&key=${apiKey}`
          );

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            if (detailsData.status === 'OK' && detailsData.result) {
              return {
                ...place,
                website: detailsData.result.website || null,
              };
            }
          }
        } catch (error) {
          console.error(`Erreur récupération détails pour ${place.place_id}:`, error);
        }
        
        return {
          ...place,
          website: null,
        };
      })
    );

    // Formater les résultats
    const formattedPlaces = placesWithDetails.map(place => {
      
      return {
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
        placeType: place.place_type,
        location: place.geometry.location,
        photos: place.photos?.slice(0, 1).map((photo) => ({
          reference: photo.photo_reference,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${apiKey}`
        })) || [],
        priceLevel: place.price_level ?? null, // Explicitement null si undefined
        openNow: place.opening_hours?.open_now,
        website: place.website || undefined
      };
    });


    return NextResponse.json({
      location: { lat, lng },
      places: formattedPlaces,
      total: formattedPlaces.length
    });

  } catch (error) {
    console.error("Erreur API Places:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la recherche des lieux" 
    }, { status: 500 });
  }
}

