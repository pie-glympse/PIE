"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GCalendar from "@/components/Gcalendar/Gcalendar";
import Gcard from "@/components/Gcard/Gcard";


type EventType = {
  id: string;
  uuid: string;
  title: string;
  description?: string;
  date?: string;
  maxPersons?: string;
  costPerPerson?: string;
  state?: string;
  tags: { id: string; name: string }[];
};

export default function HomePage() {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      // Appeler l'API de logout
      await fetch("/api/logout", { method: "POST" });
      
      // Nettoyer le context
      logout();
      
      // Rediriger vers login
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Fallback: forcer la suppression et rediriger
      logout();
      router.push("/login");
    }
  };

  // Récupérer les événements depuis l'API
  useEffect(() => {
    if (!isLoading && user) {
      fetch(`/api/events?userId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
          return res.json();
        })
        .then((data) => {
          setEvents(data);
          setFetchError(null);
        })
        .catch((err) => setFetchError(err.message));
    }
  }, [isLoading, user]);


  const adaptEventForGcard = (event: EventType) => {
    // Assigner différentes images de fond selon les tags
    const getBackgroundUrl = (tags: { id: string; name: string }[]) => {
      if (tags.some(tag => tag.name === "Restauration")) return "/images/illustration/palm.svg";
      if (tags.some(tag => tag.name === "Afterwork")) return "/images/illustration/stack.svg";
      if (tags.some(tag => tag.name === "Team Building")) return "/images/illustration/roundstar.svg";
      return "/images/illustration/roundstar.svg"; // Par défaut
    };

    return {
      title: event.title,
      date: event.date || new Date().toISOString(),
      profiles: ["/img/user1.jpg", "/img/user2.jpg", "/img/user3.jpg", "/img/user4.jpg", "/img/user5.jpg"], 
      backgroundUrl: getBackgroundUrl(event.tags),
    };
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <main className="h-screen overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
        
        {/* Section Bienvenue */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue,</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold text-gray-800">
              {user?.name || "invité"}
            </p>
            <img
              src="/images/icones/pastille.svg"
              alt="Statut utilisateur"
              className="w-6 h-6"
            />
          </div>
        </section>

        {/* Calendrier */}
        <section>
          <GCalendar year={2025} />
        </section>

        {/* Évènements à venir */}
        <section className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Évènements à venir</h2>
          
          {fetchError && (
            <p className="text-red-600 font-semibold mb-4">Erreur: {fetchError}</p>
          )}
          
          {/* Container responsive pour les cartes */}
          <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-2">
            {events.length === 0 && !fetchError && (
              <p className="text-gray-500">Aucun événement trouvé.</p>
            )}
            
            {events.slice(0, 3).map((event) => (
              <Gcard 
                eventId={event.id}
                key={event.id} 
                {...adaptEventForGcard(event)} 
                className="w-full md:w-100 h-60 md:flex-shrink-0" 
              />
            ))}

            {/* Bouton Ajouter */}
            <button
              aria-label="Ajouter un évènement"
              className="w-full md:w-20 h-60 md:flex-shrink-0 flex items-center justify-center border border-gray-300 rounded-xl hover:bg-gray-100 transition text-3xl text-gray-500"
            >
              +
            </button>
          </div>
          
          {/* Lien "voir plus" */}
          <div className="flex justify-end mt-4">
            <Link href="/events" className="text-gray-500">
              voir plus
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}