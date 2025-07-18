"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface EventCardProps {
  eventId: string;
  title: string;
  date: string;
  profiles: string[];
  backgroundUrl: string;
  backgroundSize?: number;
  className?: string;
}

export default function EventCard({
  eventId,
  title,
  date,
  profiles,
  backgroundUrl,
  backgroundSize = 200,
  className = "",
}: EventCardProps) {
  const router = useRouter();
  const displayProfiles = profiles.slice(0, 5);

  const handleCardClick = () => {
    router.push(`/events/${eventId}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le clic sur la carte
    // Logique du menu ici
  };

  return (
    <div
      className={`relative rounded-xl border border-gray-200 p-6 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Contenu principal */}
      <div className="relative z-10">
        {/* En-tête avec titre et bouton menu */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 pr-8">
            {title}
          </h3>
          
          <button
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleMenuClick}
            aria-label="Ouvrir le menu"
            type="button"
          >
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-gray-500 rounded-full block" />
              <span className="w-1 h-1 bg-gray-500 rounded-full block" />
              <span className="w-1 h-1 bg-gray-500 rounded-full block" />
            </span>
          </button>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-500 mb-4 drop-shadow">
          {new Date(date).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        {/* Profils */}
        <div className="flex -space-x-3">
          {displayProfiles.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Profil ${idx + 1}`}
              className="w-10 h-10 rounded-full border-2 border-white object-cover bg-gray-200"
            />
          ))}
          {profiles.length > 5 && (
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-600 font-medium">
                +{profiles.length - 5}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Image d'arrière-plan */}
      <img
        src={backgroundUrl}
        alt=""
        aria-hidden="true"
        className="absolute right-[-25px] bottom-[-25px] pointer-events-none opacity-80"
        style={{
          width: backgroundSize,
          height: 200,
          objectFit: "contain",
          zIndex: 1,
        }}
      />
    </div>
  );
}