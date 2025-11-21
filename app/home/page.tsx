"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GCalendar from "@/components/Gcalendar";
import Gcard from "@/components/Gcard";

type EventType = {
  id: string;
  uuid: string;
  title: string;
  description?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxPersons?: string;
  costPerPerson?: string;
  city?: string;
  maxDistance?: string;
  activityType?: string;
  recurring?: boolean;
  duration?: string;
  recurringRate?: string;
  state?: string;
  tags: { id: string; name: string }[];
  users?: { // Ajouter users pour les participants
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
};

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dropdownEvent, setDropdownEvent] = useState<string | null>(null);

  const handleFillPreferences = (event: EventType) => {
    router.push(`/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`);
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
      participants: event.users || [], // Utiliser les vrais participants ou un tableau vide
      backgroundUrl: getBackgroundUrl(event.tags),
      state: event.state, // ✅ Ajouter l'état de l'événement
    };
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Mise à jour locale en supprimant l'event supprimé
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
        alert("Événement supprimé avec succès !");
      } else {
        alert("Erreur lors de la suppression de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression :", error);
      alert("Erreur réseau lors de la suppression.");
    }
  };

  const handleShare = (eventId: string, eventTitle: string) => {
    // Logique de partage - vous pouvez adapter selon vos besoins
    alert(`Partager l'événement: ${eventTitle}`);
  };

  // Fonction pour copier un événement
  const handleCopyEvent = (event: EventType) => {
    // Fonctions utilitaires pour formater les dates et heures
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    };

    const formatTime = (timeString: string | undefined) => {
      if (!timeString) return '';
      const time = new Date(timeString);
      return time.toTimeString().split(' ')[0].substring(0, 5); // Format HH:MM
    };

    // Créer les paramètres URL pour pré-remplir le formulaire avec TOUS les champs
    const params = new URLSearchParams();
    
    params.set('copy', 'true');
    if (event.title) params.set('title',`${event.title}`);
    if (event.startDate) params.set('startDate', formatDate(event.startDate));
    if (event.endDate) params.set('endDate', formatDate(event.endDate));
    if (event.startTime) params.set('startTime', formatTime(event.startTime));
    if (event.endTime) params.set('endTime', formatTime(event.endTime));
    if (event.maxPersons) params.set('maxPersons', event.maxPersons);
    if (event.costPerPerson) params.set('costPerPerson', event.costPerPerson);
    if (event.city) params.set('city', event.city);
    if (event.maxDistance) params.set('maxDistance', event.maxDistance);
    if (event.activityType) params.set('activityType', event.activityType);
    if (event.recurring !== undefined) params.set('recurring', event.recurring.toString());
    if (event.duration) params.set('duration', event.duration);
    if (event.recurringRate) params.set('recurringRate', event.recurringRate);
    
    // Rediriger vers la page de création avec les paramètres
    router.push(`/create-event?${params.toString()}`);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const isAuthorized = user ? ["ADMIN", "SUPER_ADMIN"].includes(user.role) : false;

  return (
    <>
      <main className="overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
        
        {/* Section Bienvenue */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue,</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold text-gray-800">
              {user?.firstName || "invité"}
            </p>
            <Image
                src="/images/icones/pastille.svg"
                alt="Statut utilisateur"
                width={24}
                height={24}
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
                dropdownOpen={dropdownEvent === event.id}
                onDropdownToggle={() => setDropdownEvent(
                  dropdownEvent === event.id ? null : event.id
                )}
                isAuthorized={isAuthorized}
                onShare={() => handleShare(event.id, event.title)}
                onPreferences={() => handleFillPreferences(event)}
                onDelete={() => handleDeleteEvent(event.id)}
                onCopy={() => handleCopyEvent(event)}
                showPreferencesButton={true} // ou logique selon si l'utilisateur a déjà des préférences
              />
            ))}

            {/* Bouton Ajouter */}
            {isAuthorized && (
              <Link
                href="/create-event"
                aria-label="Ajouter un évènement"
                className="w-full md:w-20 h-60 md:flex-shrink-0 flex items-center justify-center border border-gray-300 rounded-xl hover:bg-gray-100 transition text-3xl text-gray-500"
              >
                +
              </Link>
            )}
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