"use client";

import { useState, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GCalendar from "@/components/Gcalendar";
import Gcard from "@/components/Gcard";
import { useEvents, EventType } from "@/hooks/useEvents";

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { events, setEvents, error: fetchError } = useEvents(user?.id);
  const [dropdownEvent, setDropdownEvent] = useState<string | null>(null);

  // State for leave confirmation modal
  const [leaveModal, setLeaveModal] = useState({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const handleFillPreferences = (event: EventType) => {
    router.push(
      `/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`
    );
  };

  const adaptEventForGcard = (event: EventType) => {
    const getBackgroundUrl = (tags: { id: string; name: string }[]) => {
      if (tags.some((tag) => tag.name === "Restauration"))
        return "/images/illustration/palm.svg";
      if (tags.some((tag) => tag.name === "Afterwork"))
        return "/images/illustration/stack.svg";
      if (tags.some((tag) => tag.name === "Team Building"))
        return "/images/illustration/roundstar.svg";
      return "/images/illustration/roundstar.svg";
    };

    return {
      title: event.title,
      date: event.date || new Date().toISOString(),
      participants: event.users || [],
      backgroundUrl: getBackgroundUrl(event.tags),
      state: event.state,
    };
  };

  // Function to handle leaving an event
  const handleLeaveEvent = useCallback(async () => {
    if (!leaveModal.eventId || !user) return;

    setLeaveLoading(true);
    setLeaveError(null);

    try {
      const response = await fetch(`/api/events/${leaveModal.eventId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Impossible de quitter l'événement"
        );
      }

      setEvents((prev) =>
        prev.filter((event) => event.id !== leaveModal.eventId)
      );
      closeLeaveModal();
    } catch (error) {
      console.error("Erreur lors du départ de l'événement:", error);
      setLeaveError(
        error instanceof Error
          ? error.message
          : "Erreur lors du départ de l'événement"
      );
    } finally {
      setLeaveLoading(false);
    }
  }, [leaveModal.eventId, user, setEvents]);

  // Function to open the confirmation modal
  const openLeaveModal = (event: EventType) => {
    setLeaveError(null);
    setLeaveModal({
      isOpen: true,
      eventId: event.id,
      eventTitle: event.title,
    });
  };

  const closeLeaveModal = () => {
    if (leaveLoading) return;
    setLeaveModal({ isOpen: false, eventId: "", eventTitle: "" });
    setLeaveError(null);
  };


  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
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
    alert(`Partager l'événement: ${eventTitle}`);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const isAuthorized = user
    ? ["ADMIN", "SUPER_ADMIN"].includes(user.role)
    : false;

  return (
    <>
      <main className="overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
        {/* Welcome Section */}
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

        {/* Calendar */}
        <section>
          <GCalendar year={2025} />
        </section>

        {/* Upcoming Events */}
        <section className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Évènements à venir
          </h2>

          {fetchError && (
            <p className="text-red-600 font-semibold mb-4">
              Erreur: {fetchError}
            </p>
          )}

          <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-2">
            {events.length === 0 && !fetchError && (
              <p className="text-gray-500">Aucun événement trouvé.</p>
            )}

            {events.slice(0, 3).map((event) => {
              const isParticipant =
                event.users?.some((u) => u.id === user?.id) ?? false;
              const isCreator = event.createdBy?.id === user?.id;
              const canLeave = isParticipant && !isCreator;

              return (
                <Gcard
                  eventId={event.id}
                  key={event.id}
                  {...adaptEventForGcard(event)}
                  className="w-full md:w-100 h-60 md:flex-shrink-0"
                  dropdownOpen={dropdownEvent === event.id}
                  onDropdownToggle={() =>
                    setDropdownEvent(dropdownEvent === event.id ? null : event.id)
                  }
                  isAuthorized={isAuthorized}
                  canLeave={canLeave} // Pass the canLeave prop
                  onLeave={() => openLeaveModal(event)} // Pass the handler
                  onShare={() => handleShare(event.id, event.title)}
                  onPreferences={() => handleFillPreferences(event)}
                  onDelete={() => handleDeleteEvent(event.id)}
                  showPreferencesButton={true}
                />
              );
            })}

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

          <div className="flex justify-end mt-4">
            <Link href="/events" className="text-gray-500">
              voir plus
            </Link>
          </div>
        </section>
      </main>

      {/* Leave Confirmation Modal */}
      {leaveModal.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
                <h3 className="text-h3 font-urbanist mb-4 text-[var(--color-text)]">Quitter l&apos;événement ?</h3>
                <p className="text-body-large font-poppins text-[var(--color-grey-four)] mb-4">
                  Êtes-vous sûr de vouloir quitter <span className="font-semibold">{leaveModal.eventTitle}</span> ? Vous
                  ne recevrez plus d&apos;informations sur cet événement.
                </p>
                {leaveError && <p className="text-sm text-red-600 mb-4">{leaveError}</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={closeLeaveModal}
                    disabled={leaveLoading}
                    className="px-4 py-2 bg-white border border-[var(--color-grey-three)] text-[var(--color-grey-four)] rounded hover:border-[var(--color-main)] hover:bg-[var(--color-grey-one)] transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleLeaveEvent}
                    disabled={leaveLoading}
                    className="px-4 py-2 bg-[#FFD1D1] text-red-700 rounded hover:bg-[#FFBDBD] transition disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {leaveLoading ? "Départ..." : "Quitter l'événement"}
                  </button>
                </div>
              </div>
            </div>
          )}
    </>
  );
}