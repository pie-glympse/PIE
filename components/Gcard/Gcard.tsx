"use client";
import React from "react";

interface EventCardProps {
  title: string;
  date: string;
  profiles: string[];
  backgroundUrl: string;
  backgroundSize?: number; // taille en pixels
  className?: string;
}

export default function EventCard({
  title,
  date,
  profiles,
  backgroundUrl,
  backgroundSize = 200,
  className = "",
}: EventCardProps) {
  const displayProfiles = profiles.slice(0, 5);

  return (
    <div
      className={`relative rounded-xl border-1 border-gray-200 p-6 overflow-hidden ${className}`}
    >
      <div className="relative z-10">
        <div className="flex">
           <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
           <button
            className="absolute top-3 right-3 z-20 p-1 rounded-full hover:bg-gray-100"
            /* onClick={} */
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
        <p className="text-sm text-gray-500 mb-4 drop-shadow">
          {new Date(date).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <div className="flex -space-x-3">
          {displayProfiles.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Profil ${idx + 1}`}
              className="w-10 h-10 rounded-full border-3 border-white object-cover bg-gray-200"
            />
          ))}
        </div>
      </div>
      
      <img
        src={backgroundUrl}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -25,
          bottom: -25,
          width: backgroundSize,
          height: 200,
          objectFit: "contain",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
}