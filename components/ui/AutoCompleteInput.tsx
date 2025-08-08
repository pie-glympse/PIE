// components/AutoCompleteInput.tsx
'use client';

import { useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlacesApiResponse {
  suggestions: Array<{
    placePrediction: {
      placeId: string;
      text: { text: string };
      structuredFormat: {
        mainText: { text: string };
        secondaryText?: { text: string };
      };
    };
  }>;
}

export default function AutoCompleteInput({ value, onChange, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce pour éviter trop de requêtes
  let timeoutId: NodeJS.Timeout;

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    // Clear le timeout précédent
    clearTimeout(timeoutId);
    
    if (inputValue.length > 2) {
      setIsLoading(true);
      
      // Debounce de 300ms
      timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            },
            body: JSON.stringify({
              input: inputValue,
              includedPrimaryTypes: ['establishment', 'geocode'], // Pour des adresses complètes
              regionCode: 'FR',
              languageCode: 'fr'
            })
          });
          
          if (response.ok) {
            const data: PlacesApiResponse = await response.json();
            if (data.suggestions && data.suggestions.length > 0) {
              const transformedSuggestions = data.suggestions.map((suggestion) => ({
                place_id: suggestion.placePrediction.placeId,
                description: suggestion.placePrediction.text.text,
                structured_formatting: {
                  main_text: suggestion.placePrediction.structuredFormat.mainText.text,
                  secondary_text: suggestion.placePrediction.structuredFormat.secondaryText?.text || ''
                }
              }));
              setSuggestions(transformedSuggestions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          } else {
            console.error('Erreur API Places:', response.status, await response.text());
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Erreur lors de la recherche:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => handleInputChange(e.target.value)}
        placeholder={placeholder || 'Adresse complète'}
        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-poppins text-left border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium text-gray-900">
                {suggestion.structured_formatting.main_text}
              </div>
              {suggestion.structured_formatting.secondary_text && (
                <div className="text-xs text-gray-600 mt-1">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          Suggestions: {suggestions.length}, Show: {showSuggestions.toString()}, Loading: {isLoading.toString()}
        </div>
      )}
    </div>
  );
}
