"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import BackArrow from "@/components/ui/BackArrow";
import ShareButton from "@/components/ui/ShareButton";
import TabNavigation from "@/components/ui/TabNavigation";
import EventInformations from "@/components/event/EventInformations";
import EventParticipants from "@/components/event/EventParticipants";
import EventDocuments from "@/components/event/EventDocuments";
import { useUser } from "@/context/UserContext";

type EventDetails = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  maxPersons?: string;
  costPerPerson?: string;
  activityType?: string;
  state?: string;
  city?: string; // Ajouter le champ city
  tags: { id: string; name: string }[];
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export default function SingleEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useUser();

  const id = params.id as string;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("informations");

  // État pour gérer l'accordéon
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  const tabs = [
    {
      id: "informations",
      label: "Informations",
      active: activeTab === "informations",
    },
    {
      id: "participants",
      label: "Participants",
      active: activeTab === "participants",
    },
    { id: "documents", label: "Documents", active: activeTab === "documents" },
  ];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Événement non trouvé");
          } else {
            setError("Erreur lors du chargement");
          }
          return;
        }

        const data = await response.json();
        setEvent(data.event || data);
      } catch (err) {
        setError("Erreur de connexion");
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleShare = () => {
    console.log("Partager l'événement");
  };

  // Fonction pour changer l'état de l'événement (Admin seulement)
  const handleChangeEventState = async (newState: string) => {
    if (!event) return;

    try {
      const response = await fetch(`/api/events/${event.id}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: newState }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();

        // ✅ Mettre à jour l'événement local avec toutes les nouvelles données
        setEvent((prev) => (prev ? { 
          ...prev, 
          state: updatedEvent.state,
          activityType: updatedEvent.activityType || prev.activityType,
          date: updatedEvent.startDate || prev.date,
        } : null));
        setIsStateDropdownOpen(false);

        console.log(`État de l'événement changé vers: ${updatedEvent.state}`);
        
        // ✅ Recharger la page si on a finalisé l'événement pour voir les changements
        if (newState === 'confirmed') {
          window.location.reload();
        }
      } else {
        alert("Erreur lors du changement d'état de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors du changement d'état :", error);
      alert("Erreur réseau lors du changement d'état.");
    }
  };

  // Fonction pour obtenir le texte du bouton selon l'état actuel
  const getStateButtonText = (state: string) => {
    switch (state?.toLowerCase()) {
      case "pending":
        return "Finaliser avec les votes";
      case "confirmed":
        return "Planifier l'événement";
      case "planned":
        return "Réouvrir les votes";
      default:
        return "Confirmer l'événement";
    }
  };

  // Fonction pour obtenir la couleur de la pastille selon l'état
  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "planned":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Liste des états possibles
  const availableStates = [
    { value: "pending", label: "En attente", color: "bg-yellow-500" },
    { value: "confirmed", label: "Confirmé", color: "bg-green-500" },
    { value: "planned", label: "Planifié", color: "bg-blue-500" },
  ];

  const renderTabContent = () => {
    if (!event) return null;

    switch (activeTab) {
      case "informations":
        return <EventInformations event={event} />;
      case "participants":
        return (
          <EventParticipants
            participants={event.users.map((user) => ({
              ...user,
              id: Number(user.id),
            }))}
          />
        );
      case "documents":
        return <EventDocuments />;
      default:
        return <EventInformations event={event} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Chargement de l&apos;événement...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "Événement non trouvé"}
          </p>
          <button
            onClick={() => router.push("/events")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retour aux événements
          </button>
        </div>
      </div>
    );
  }
  // TODO: Remplacez ceci par la récupération réelle de l'utilisateur connecté depuis votre contexte d'authentification ou provider
    
    const isAuthorized = user && ["ADMIN", "SUPER_ADMIN"].includes(user.role);


  const organizer = event.users?.[0];

  return (
    <section className="h-screen overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
      <div className="h-full w-full flex flex-col gap-6 items-start p-4 md:p-10">
        {/* Header avec logo et back arrow */}
        <BackArrow onClick={() => router.back()} className="" />

        {/* Header de l'événement */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">
              {event.title}
            </h1>
            <p className="text-body-large font-poppins text-[var(--color-text)]">
              Organisé par{" "}
              {`${organizer?.firstName} ${organizer?.lastName}` || "Organisateur inconnu"}
            </p>

            {/* ✅ Afficher les résultats des votes si l'événement est confirmé */}
            {event.state?.toLowerCase() === 'confirmed' && (
              <div className="mt-6 p-6 rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 font-urbanist font-semibold mb-3">
                      Événement finalisé avec succès !
                    </h3>
                    <div className="space-y-3">
                      {event.activityType && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <span className="text-body-large font-poppins font-medium text-[var(--color-text)]">
                              Activité sélectionnée :
                            </span>
                            <span className="ml-2 text-body-large font-poppins text-green-700 font-semibold">
                              {event.activityType}
                            </span>
                          </div>
                        </div>
                      )}
                      {event.date && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <span className="text-body-large font-poppins font-medium text-[var(--color-text)]">
                              Date retenue :
                            </span>
                            <span className="ml-2 text-body-large font-poppins text-green-700 font-semibold">
                              {new Date(event.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-green-200">
                      <p className="text-body-small font-poppins text-green-600 italic">
                        Résultats basés sur les votes des participants
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <ShareButton onClick={handleShare} />
                        {isAuthorized && (
          <button
              className="p-4"
              onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
              
            >
          <div className="relative content-center w-fit flex align-center gap-2">
            <div
                className={`w-3 h-3 rounded-full ${getStateColor(
                  event.state || "pending"
                )}`}
              ></div>
            <div className="flex items-center gap-2 rounded-full transition-all">
              
              <svg
                className={`w-4 h-4 text-black transition-transform ${
                  isStateDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            

            {/* Dropdown des états */}
            {isStateDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48">
                {availableStates.map((stateOption) => (
                  <button
                    key={stateOption.value}
                    onClick={() => handleChangeEventState(stateOption.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                      event.state?.toLowerCase() === stateOption.value
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${stateOption.color}`}
                    ></div>
                    <span className="text-gray-700">{stateOption.label}</span>
                    {event.state?.toLowerCase() === stateOption.value && (
                      <svg
                        className="w-4 h-4 text-green-600 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </button>

        )}
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="w-full">
          <TabNavigation tabs={tabs} onTabChange={handleTabChange} />
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="w-full flex-1 overflow-auto">{renderTabContent()}</div>

        {/* ✅ Pastille avec accordéon pour changer l'état (Admin seulement) */}
        

        {/* Image en bas à droite - fixe pour toutes les sections */}
        <div className="fixed bottom-0 right-0 z-[-1] pointer-events-none">
          <Image
            src="/icons/formsingleevent.png"
            alt="Décoration"
            width={500}
            height={100}
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
}
