import { NextResponse } from "next/server";

// ✅ Mapping des types de lieux vers des types valides pour Nearby Search
// Certains types peuvent ne pas être supportés directement par Nearby Search
// Liste des types valides: https://developers.google.com/maps/documentation/places/web-service/supported_types
const PLACE_TYPE_MAPPING: Record<string, string[]> = {
  // Types qui peuvent causer des erreurs 4xx - on les mappe vers des types valides
  'sports_activity_location': ['gym', 'sports_complex'], // Fallback vers des types valides
  'sports_coaching': ['gym', 'sports_club'], // Fallback vers des types valides
  // Les autres types devraient être valides
};

// Types connus comme invalides pour Nearby Search (mais valides dans les réponses)
const INVALID_FOR_NEARBY_SEARCH = [
  'sports_activity_location', // Trop générique
  'sports_coaching', // Pas un type de lieu physique
];

// Fonction pour obtenir les types valides (peut retourner plusieurs fallbacks)
function getValidPlaceTypes(type: string): string[] {
  if (PLACE_TYPE_MAPPING[type]) {
    return PLACE_TYPE_MAPPING[type];
  }
  // Si le type est dans la liste des invalides, retourner un fallback générique
  if (INVALID_FOR_NEARBY_SEARCH.includes(type)) {
    return ['gym']; // Fallback par défaut
  }
  return [type]; // Type valide tel quel
}

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
  const startTime = Date.now();
  try {
    const { city, placeTypes, radius = 5000, eventId } = await request.json();
    
    // Log de début de requête
    console.log(`🔍 [Places API] Début de recherche pour eventId: ${eventId || 'N/A'}`, {
      city,
      placeTypesCount: placeTypes?.length || 0,
      placeTypes: placeTypes,
      radius
    });


    if (!city) {
      return NextResponse.json({ error: "Ville manquante" }, { status: 400 });
    }

    if (!placeTypes || placeTypes.length === 0) {
      return NextResponse.json({ error: "Types de lieux manquants" }, { status: 400 });
    }

    // ✅ Vérifier la clé API - essayer plusieurs variantes
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ [Places API] Aucune clé API trouvée');
      console.error('Variables d\'environnement disponibles:', {
        hasGOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
        hasNEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        nodeEnv: process.env.NODE_ENV
      });
      return NextResponse.json({ 
        error: "Clé API Google manquante",
        details: "Vérifiez que NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ou GOOGLE_MAPS_API_KEY est définie dans .env.local"
      }, { status: 500 });
    }
    
    // Log (sans exposer la clé complète)
    const apiKeyPreview = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
    console.log(`🔑 [Places API] Clé API utilisée: ${apiKeyPreview} (longueur: ${apiKey.length})`);

    // Étape 1: Geocoder la ville pour obtenir les coordonnées
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`;
    console.log(`📍 [Geocoding API] Appel pour: ${city}`);
    
    let geocodeResponse;
    try {
      geocodeResponse = await fetch(geocodeUrl);
    } catch (fetchError) {
      console.error('❌ [Geocoding API] Erreur réseau:', fetchError);
      return NextResponse.json({ 
        error: "Erreur réseau lors de l'appel Geocoding API",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError)
      }, { status: 500 });
    }

    if (!geocodeResponse.ok) {
      const errorText = await geocodeResponse.text().catch(() => '');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error(`❌ [Geocoding API] Erreur HTTP: ${geocodeResponse.status} ${geocodeResponse.statusText}`);
      console.error('Détails:', errorData);
      
      // Si c'est une erreur 4xx, retourner le statut exact
      if (geocodeResponse.status >= 400 && geocodeResponse.status < 500) {
        return NextResponse.json({ 
          error: "Erreur lors du geocoding",
          details: errorData.error_message || errorData.error || `HTTP ${geocodeResponse.status}`,
          status: geocodeResponse.status
        }, { status: geocodeResponse.status });
      }
      
      return NextResponse.json({ 
        error: "Erreur lors du geocoding",
        details: `HTTP ${geocodeResponse.status}: ${geocodeResponse.statusText}`
      }, { status: 500 });
    }

    const geocodeData = await geocodeResponse.json();
    
    // Log détaillé pour le geocoding
    console.log('📍 [Geocoding API] Réponse:', {
      status: geocodeData.status,
      resultsCount: geocodeData.results?.length || 0,
      error_message: geocodeData.error_message
    });

    // Gérer les erreurs de geocoding
    if (geocodeData.status === 'REQUEST_DENIED') {
      console.error('❌ [Geocoding API] REQUEST_DENIED');
      console.error('💡 Vérifiez que la Geocoding API est activée dans Google Cloud Console');
      console.error('Détails:', geocodeData.error_message);
      return NextResponse.json({ 
        error: "Geocoding API non autorisée. Vérifiez la configuration de la clé API.",
        details: geocodeData.error_message || "REQUEST_DENIED"
      }, { status: 403 });
    }

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      console.error('❌ [Geocoding API] Échec:', geocodeData.status, geocodeData.error_message);
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
    const errors: Array<{ type: string; error: string; status?: string }> = [];
    const successCount: Record<string, number> = {};
    
    // ✅ Normaliser et mapper les types de lieux
    const typesToSearch: Array<{ original: string; searchTypes: string[] }> = placeTypes.map((type: string) => ({
      original: type,
      searchTypes: getValidPlaceTypes(type)
    }));
    
    // Aplatir et dédupliquer
    const allSearchTypes = new Set<string>();
    typesToSearch.forEach(({ searchTypes }) => {
      searchTypes.forEach(t => allSearchTypes.add(t));
    });
    
    console.log(`🔍 [Places API] Recherche de ${allSearchTypes.size} types uniques (${placeTypes.length} originaux)`);
    typesToSearch.forEach(({ original, searchTypes }) => {
      if (searchTypes[0] !== original) {
        console.log(`🔄 [Places API] Type mappé: ${original} → ${searchTypes.join(', ')}`);
      }
    });

    for (const type of Array.from(allSearchTypes)) {
      // ✅ Utiliser le paramètre 'type' pour l'ancienne API
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
      
      console.log(`🔍 [Places API] Recherche pour type: ${type}`);
      const placesResponse = await fetch(url);
      
      console.log(`📡 [Places API] Réponse HTTP pour ${type}:`, {
        status: placesResponse.status,
        statusText: placesResponse.statusText,
        ok: placesResponse.ok
      });

      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        
        console.log(`📦 [Places API] Données pour ${type}:`, {
          status: placesData.status,
          resultsCount: placesData.results?.length || 0,
          error_message: placesData.error_message
        });
        
        // ✅ Gérer les erreurs de l'API Places
        if (placesData.status === 'REQUEST_DENIED') {
          console.error(`❌ [Places API] REQUEST_DENIED pour le type ${type}`);
          console.error('💡 Vérifiez que la Places API est activée dans Google Cloud Console');
          console.error('Détails:', placesData.error_message);
          return NextResponse.json({ 
            error: "Places API non autorisée. Vérifiez la configuration de la clé API et que la Places API est activée.",
            details: placesData.error_message || "REQUEST_DENIED",
            type: type
          }, { status: 403 });
        }

        if (placesData.status === 'OVER_QUERY_LIMIT') {
          console.error(`❌ Places API: OVER_QUERY_LIMIT pour le type ${type}`);
          return NextResponse.json({ 
            error: "Quota de l'API Places dépassé. Veuillez réessayer plus tard.",
            details: placesData.error_message
          }, { status: 429 });
        }

        if (placesData.status === 'INVALID_REQUEST') {
          console.error(`❌ [Places API] INVALID_REQUEST pour le type ${type}`);
          console.error('Message:', placesData.error_message);
          console.error('💡 Ce type de lieu n\'est peut-être pas valide pour Nearby Search');
          console.error('💡 Vérifiez la documentation: https://developers.google.com/maps/documentation/places/web-service/supported_types');
          // Continuer avec les autres types au lieu de retourner une erreur
          // Ne pas compter cela comme une erreur fatale
          continue;
        }
        
        // ✅ Gérer les autres erreurs 4xx
        if (['ZERO_RESULTS', 'NOT_FOUND'].includes(placesData.status)) {
          // Ces statuts sont normaux, on continue
          console.log(`ℹ️ [Places API] ${placesData.status} pour ${type} - Aucun résultat trouvé`);
          continue;
        }
        
        if (placesData.status && !['OK', 'ZERO_RESULTS'].includes(placesData.status)) {
          console.warn(`⚠️ [Places API] Statut inattendu pour ${type}: ${placesData.status}`, placesData.error_message);
          // Continuer avec les autres types
          continue;
        }
        
        if (placesData.status === 'OK' && placesData.results) {
          // Ajouter les résultats avec le type, en évitant les doublons
          const addedCount = placesData.results.filter((place: GooglePlace) => !seenPlaceIds.has(place.place_id)).length;
          for (const place of placesData.results) {
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
              allPlaces.push({
                ...place,
                place_type: type
              });
            }
          }
          successCount[type] = (successCount[type] || 0) + addedCount;
          console.log(`✅ [Places API] ${addedCount} lieux ajoutés pour ${type}`);
        } else {
          // Statut autre que OK - déjà géré ci-dessus
          if (placesData.status !== 'ZERO_RESULTS') {
            errors.push({
              type,
              error: placesData.error_message || placesData.status,
              status: placesData.status
            });
          }
          console.log(`ℹ️ [Places API] Statut ${placesData.status} pour ${type}`);
        }
      } else {
        // Si la requête HTTP échoue (pas juste l'API Google)
        const errorText = await placesResponse.text().catch(() => '');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || placesResponse.statusText };
        }
        
        console.error(`❌ [Places API] Erreur HTTP pour ${type}:`, {
          status: placesResponse.status,
          statusText: placesResponse.statusText,
          error: errorData,
          url: url.replace(apiKey, 'API_KEY_HIDDEN') // Masquer la clé dans les logs
        });
        
        if (placesResponse.status === 403) {
          console.error(`❌ [Places API] HTTP 403 Forbidden pour ${type}`);
          console.error('💡 Cela peut indiquer:');
          console.error('   - Restrictions de domaine sur la clé API');
          console.error('   - Restrictions d\'API sur la clé API');
          console.error('   - Clé API invalide ou expirée');
          errors.push({
            type,
            error: `HTTP 403 Forbidden: ${errorData.error || placesResponse.statusText}`,
            status: '403'
          });
          // Ne pas retourner immédiatement, continuer avec les autres types
          console.warn(`⚠️ [Places API] Continuation avec les autres types après erreur 403 pour ${type}`);
          continue;
        }
        
        // Pour les autres erreurs HTTP 4xx, continuer avec les autres types
        if (placesResponse.status >= 400 && placesResponse.status < 500) {
          errors.push({
            type,
            error: `HTTP ${placesResponse.status}: ${errorData.error || placesResponse.statusText}`,
            status: placesResponse.status.toString()
          });
          console.warn(`⚠️ [Places API] Erreur HTTP ${placesResponse.status} pour ${type}, continuation avec les autres types`);
          continue;
        }
        
        // Pour les autres erreurs HTTP, continuer avec les autres types
        console.warn(`⚠️ [Places API] Continuation avec les autres types après erreur HTTP ${placesResponse.status} pour ${type}`);
      }
    }

    // ✅ Vérifier qu'on a au moins quelques résultats
    if (allPlaces.length === 0) {
      console.warn('⚠️ Aucun lieu trouvé pour les types:', placeTypes);
      // Retourner un tableau vide plutôt qu'une erreur, car c'est peut-être normal
      return NextResponse.json({
        location: { lat, lng },
        places: [],
        total: 0,
        message: "Aucun lieu trouvé pour les critères spécifiés"
      });
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


    const duration = Date.now() - startTime;
    
    // ✅ Résumé des résultats
    console.log(`✅ [Places API] Recherche terminée en ${duration}ms`, {
      eventId: eventId || 'N/A',
      totalPlaces: formattedPlaces.length,
      city,
      successCount,
      errorsCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
    // Afficher un résumé des erreurs si il y en a
    if (errors.length > 0) {
      console.warn(`⚠️ [Places API] ${errors.length} type(s) ont échoué:`, errors);
      console.warn('💡 Ces erreurs peuvent être dues à:');
      console.warn('   - Types de lieux invalides pour Nearby Search');
      console.warn('   - Restrictions sur la clé API');
      console.warn('   - Quotas dépassés');
    }

    return NextResponse.json({
      location: { lat, lng },
      places: formattedPlaces,
      total: formattedPlaces.length,
      // Inclure les erreurs dans la réponse pour le debug (seulement en développement)
      ...(process.env.NODE_ENV === 'development' && errors.length > 0 && {
        _debug: {
          errors: errors,
          successCount: successCount
        }
      })
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Places API] Erreur après ${duration}ms:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json({ 
      error: "Erreur lors de la recherche des lieux",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

