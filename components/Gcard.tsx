"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EventCardProps {
  eventId: string;
  title: string;
  date: string;
  participants?: Participant[]; 
  backgroundUrl: string;
  backgroundSize?: number; 
  className?: string;
  dropdownOpen?: boolean;
  onDropdownToggle?: () => void;
  isAuthorized?: boolean;
  onShare?: () => void;
  onPreferences?: () => void;
  onDelete?: () => void;
  showPreferencesButton?: boolean;
  state?: string; // ✅ Ajouter la prop state
}

export default function EventCard({
  eventId,
  title,
  date,
  participants = [],
  backgroundUrl,
  backgroundSize = 200,
  className = "",
  dropdownOpen = false,
  onDropdownToggle,
  isAuthorized = false,
  onShare,
  onDelete,
  showPreferencesButton = false,
  state, // ✅ Destructurer la prop state
}: EventCardProps) {
  const router = useRouter();
  const displayParticipants = participants.slice(0, 5);
  const remainingCount = participants.length - 5;

  const handleCardClick = () => {
    router.push(`/events/${eventId}`);
  };

  // Fonction pour gérer la redirection vers answer-event
  const handlePreferencesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/answer-event/${eventId}?eventTitle=${encodeURIComponent(title)}`);
    onDropdownToggle?.(); // Ferme le dropdown
  };

  // ✅ Fonction pour obtenir la couleur de la pastille selon l'état
  const getStateColor = (eventState: string) => {
    switch (eventState?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-green-500';
      case 'planned':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`relative rounded-xl border border-gray-200 p-6 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Contenu principal */}
      <div className="relative z-10">
        <div className="flex">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          
          {/* Container pour la pastille d'état et le menu */}
          <div className="ml-auto flex items-center gap-2">
            {/* ✅ Pastille d'état */}
            {state && (
              <div className={`w-3 h-3 rounded-full ${getStateColor(state)}`}></div>
            )}
            
            {/* Menu dropdown avec 3 petits points */}
            <div className="relative">
              <button
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDropdownToggle?.();
                }}
                aria-label="Ouvrir le menu"
                type="button"
              >
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-gray-500 rounded-full block" />
                  <span className="w-1 h-1 bg-gray-500 rounded-full block" />
                  <span className="w-1 h-1 bg-gray-500 rounded-full block" />
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-8 right-0 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48">
                  {isAuthorized && onShare && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                        onDropdownToggle?.();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Partager
                    </button>
                  )}
                  
                  {/* ✅ Masquer le bouton préférences si l'état est "confirmed" */}
                  {showPreferencesButton && state?.toLowerCase() !== 'confirmed' && (
                    <button
                      onClick={handlePreferencesClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Remplir mes préférences
                    </button>
                  )}

                  {/* ✅ Afficher un message si les votes sont fermés */}
                  {state?.toLowerCase() === 'confirmed' && (
                    <div className="px-4 py-2 text-sm text-gray-500 italic">
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Votes fermés
                    </div>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        onDropdownToggle?.();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-500 mb-4 drop-shadow">
          {new Date(date).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        {/* Avatars des participants - adaptés selon la hauteur */}
        <div className={`flex -space-x-3 ${className?.includes('h-24') || className?.includes('h-20') ? 'scale-50 origin-left' : ''}`}>
          {displayParticipants.map((participant) => (
            <div
              key={participant.id}
              className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative"
              title={`${participant.firstName} ${participant.lastName}`}
            >
              <Image
                src="/icons/round.png"
                alt={`Avatar de ${participant.firstName} ${participant.lastName}`}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </div>
          ))}
          
          {/* Affichage du nombre restant si plus de 5 participants */}
          {remainingCount > 0 && (
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-600 font-medium">
                +{remainingCount}
              </span>
            </div>
          )}
          
          {/* Si aucun participant, afficher un message */}
          {participants.length === 0 && (
            <p className={`text-gray-500 italic ${className?.includes('h-24') || className?.includes('h-20') ? 'text-xs' : 'text-sm'}`}>
              Encore aucun participant
            </p>
          )}
        </div>
      </div>
      
      {/* Image d'arrière-plan */}
      <Image
        src={backgroundUrl}
        alt=""
        aria-hidden="true"
        className="absolute right-[-25px] bottom-[-25px] pointer-events-none"
        width={backgroundSize}
        height={200}
        style={{
          objectFit: "contain",
          zIndex: 1,
        }}
        priority
      />
    </div>
  );
}