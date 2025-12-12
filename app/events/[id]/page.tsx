"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/components/ui/BackArrow";
import ShareButton from "@/components/ui/ShareButton";
import TabNavigation from "@/components/ui/TabNavigation";
import EventInformations from "@/components/event/EventInformations";
import EventParticipants from "@/components/event/EventParticipants";
import EventDocuments from "@/components/event/EventDocuments";
import { useUser } from "@/context/UserContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type EventDetails = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxPersons?: string;
  costPerPerson?: string;
  activityType?: string;
  state?: string;
  city?: string;
  maxDistance?: number;
  tags: { id: string; name: string }[];
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyId?: string;
  }[];
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default function SingleEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();

  const id = params.id as string;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("informations");

  // État pour la modal de partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // État pour gérer l'accordéon
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  // État pour la modal de quitter l'événement
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // État pour la modal de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Fonctions pour la modal de partage
  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        alert("Lien copié dans le presse-papiers !");
        setIsShareModalOpen(false);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie:", err);
      });
  };

  const handleEmailShare = () => {
    if (!event) return;
    const subject = encodeURIComponent(`Invitation à l'événement: ${event.title}`);
    const body = encodeURIComponent(
      `Bonjour ! Nous vous invitons à participer à l'événement "${event.title}". Vous pouvez voir tous les détails et vous inscrire via ce lien : ${window.location.href}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setIsShareModalOpen(false);
  };

  // Fonctions pour les boutons d'action
  const handleAddMembers = () => {
    console.log("Ajouter des membres");
    // TODO: Implémenter la logique d'ajout de membres
  };

  const handleUploadDocument = () => {
    console.log("Upload document");
    // TODO: Implémenter la logique d'upload de document
  };

  const openLeaveModal = () => {
    setIsLeaveModalOpen(true);
    setLeaveError(null);
  };

  const closeLeaveModal = () => {
    setIsLeaveModalOpen(false);
    setLeaveError(null);
  };

  const handleLeaveEvent = async () => {
    if (!event || !user) return;

    try {
      const response = await fetch(`/api/events/${event.id}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        closeLeaveModal();
        router.push("/events"); // Rediriger vers la liste des événements
      } else {
        const errorData = await response.json();
        setLeaveError(errorData.error || "Erreur lors du départ de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors du départ de l'événement :", error);
      setLeaveError("Erreur réseau lors du départ de l'événement.");
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteError(null);
  };

  const handleDeleteEvent = async () => {
    if (!event || !user) return;

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        closeDeleteModal();
        router.push("/events"); // Rediriger vers la liste des événements
      } else {
        const errorData = await response.json();
        setDeleteError(errorData.error || "Erreur lors de la suppression de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression de l'événement :", error);
      setDeleteError("Erreur réseau lors de la suppression de l'événement.");
    }
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

        // ✅ Mise à jour complète de l'événement sans rechargement
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                state: updatedEvent.state,
                activityType: updatedEvent.activityType || prev.activityType,
                date: updatedEvent.startDate || updatedEvent.date || prev.date,
                startDate: updatedEvent.startDate || prev.startDate,
                endDate: updatedEvent.endDate || prev.endDate,
                startTime: updatedEvent.startTime || prev.startTime,
                endTime: updatedEvent.endTime || prev.endTime,
              }
            : null
        );

        setIsStateDropdownOpen(false);

        // ✅ Si confirmé, recharger les données complètes pour s'assurer d'avoir tout
        if (newState === "confirmed") {
          try {
            const refreshResponse = await fetch(`/api/events/${event.id}`);
            if (refreshResponse.ok) {
              const refreshedData = await refreshResponse.json();
              setEvent(refreshedData.event || refreshedData);
            }
          } catch (refreshError) {
            console.error("Erreur lors du rechargement des données:", refreshError);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "Erreur inconnue" }));
        console.error("Erreur API:", errorData);
        alert(`Erreur lors du changement d'état: ${errorData.message || errorData.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur réseau lors du changement d'état :", error);
      alert(`Erreur réseau lors du changement d'état: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
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
          <p className="text-red-600 text-lg mb-4">{error || "Événement non trouvé"}</p>
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

  const organizer = event.createdBy || event.users?.[0];
  // Comparer les IDs en tant que strings pour éviter les problèmes de type
  const isCreator = user && event.createdBy?.id && String(event.createdBy.id) === String(user.id);
  const isParticipant = user && event.users?.some((p) => String(p.id) === String(user.id));
  const canLeaveEvent = !isCreator && isParticipant;

  return (
    <section className="min-h-screen pt-24 p-10 flex flex-col gap-8">
      <div className="w-full flex flex-col gap-6 items-start p-4 md:p-10">
        {/* Header avec logo et back arrow */}
        <BackArrow onClick={() => router.push("/home")} className="!mb-0" />

        {/* Header de l'événement */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">{event.title}</h1>
            <p className="text-body-large font-poppins text-[var(--color-text)]">
              Organisé par {`${organizer?.firstName} ${organizer?.lastName}` || "Organisateur inconnu"}
            </p>

            {/* ✅ Afficher les résultats des votes si l'événement est confirmé */}
            {event.state?.toLowerCase() === "confirmed" && (
              <div className="mt-6 p-6 rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 font-urbanist font-semibold mb-3">Événement finalisé avec succès !</h3>
                    <div className="space-y-3">
                      {/* ✅ Afficher l'activityType original */}
                      {event.activityType && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <span className="text-body-large font-poppins font-medium text-[var(--color-text)]">
                              Type d&apos;événement :
                            </span>
                            <span className="ml-2 text-body-large font-poppins text-blue-700 font-semibold">
                              {event.activityType}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* ✅ Afficher le tag préféré voté */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <span className="text-body-large font-poppins font-medium text-[var(--color-text)]">
                              Préférence choisie :
                            </span>
                            <span className="ml-2 text-body-large font-poppins text-green-700 font-semibold">
                              {event.tags[0].name}
                            </span>
                          </div>
                        </div>
                      )}
                      {(event.date || event.startDate) && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <span className="text-body-large font-poppins font-medium text-[var(--color-text)]">
                              Date retenue :
                            </span>
                            <span className="ml-2 text-body-large font-poppins text-green-700 font-semibold">
                              {new Date(event.date || event.startDate!).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
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
            {/* Boutons conditionnels à gauche du bouton partager */}
            <div className="flex items-center gap-3">
              {activeTab === "participants" && isAuthorized && (
                <button
                  onClick={handleAddMembers}
                  className="px-4 py-2 bg-white text-[var(--color-grey-four)] text-body-large  font-poppins hover:opacity-90 transition-opacity border-2 border-[var(--color-grey-three)] hover:border-[var(--color-main)]"
                  style={{ borderRadius: "4px" }}
                >
                  Ajouter des membres
                </button>
              )}

              {activeTab === "documents" && (
                <button
                  onClick={handleUploadDocument}
                  className="px-4 py-2 bg-white text-[var(--color-grey-four)] text-body-large  font-poppins hover:opacity-90 transition-opacity border-2 border-[var(--color-grey-three)] hover:border-[var(--color-main)]"
                  style={{ borderRadius: "4px" }}
                >
                  Upload
                </button>
              )}

              {/* Bouton Quitter l'événement - visible si l'utilisateur est participant mais pas créateur */}
              {canLeaveEvent && (
                <button
                  onClick={openLeaveModal}
                  className="px-4 py-2 bg-white text-red-600 text-body-large font-poppins hover:bg-red-50 hover:text-red-700 transition-colors border-2 border-red-300 rounded-lg cursor-pointer"
                >
                  Quitter l'événement
                </button>
              )}

              {isCreator && (
                <button
                  onClick={openDeleteModal}
                  className="px-4 py-2 bg-white text-red-600 text-body-large font-poppins hover:bg-red-50 hover:text-red-700 transition-colors border-2 border-red-300 rounded-lg cursor-pointer"
                >
                  Supprimer l'événement
                </button>
              )}

              <ShareButton onClick={handleShare} />

              {isAuthorized && (
                <div className="relative">
                  <button className="p-4" onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}>
                    <div className="content-center w-fit flex align-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStateColor(event.state || "pending")}`}></div>
                      <div className="flex items-center gap-2 rounded-full transition-all">
                        <svg
                          className={`w-4 h-4 text-black transition-transform ${
                            isStateDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown des états - sorti du bouton pour éviter l'imbrication */}
                  {isStateDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48">
                      {availableStates.map((stateOption) => (
                        <button
                          key={stateOption.value}
                          onClick={() => handleChangeEventState(stateOption.value)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                            event.state?.toLowerCase() === stateOption.value ? "bg-gray-100" : ""
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${stateOption.color}`}></div>
                          <span className="text-gray-700">{stateOption.label}</span>
                          {event.state?.toLowerCase() === stateOption.value && (
                            <svg className="w-4 h-4 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
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
              )}
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="w-full">
          <TabNavigation tabs={tabs} onTabChange={handleTabChange} />
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="w-full">{renderTabContent()}</div>

        {/* Modal de partage */}
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <h3 className="text-h3 font-urbanist mb-4">Partager l&apos;événement</h3>
                <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-6">
                  Choisissez comment vous souhaitez partager cet événement
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-3 p-4 border-2 border-[var(--color-grey-two)] rounded-lg hover:border-[var(--color-main)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-poppins text-body-large">Copier le lien</span>
                  </button>

                  <button
                    onClick={handleEmailShare}
                    className="w-full flex items-center justify-center gap-3 p-4 border-2 border-[var(--color-grey-two)] rounded-lg hover:border-[var(--color-main)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-poppins text-body-large">Partager par email</span>
                  </button>
                </div>

                <button
                  onClick={handleShareModalClose}
                  className="mt-6 px-6 py-2 text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition-colors font-poppins text-body-large"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation pour quitter l'événement */}
        {isLeaveModalOpen && event && (
          <ConfirmationModal
            isOpen={isLeaveModalOpen}
            onClose={closeLeaveModal}
            onConfirm={handleLeaveEvent}
            title={`Quitter l'événement "${event.title}"`}
            message="Êtes-vous sûr de vouloir quitter cet événement ? Cette action est irréversible."
            confirmButtonText="Oui, quitter"
            cancelButtonText="Annuler"
            error={leaveError}
          />
        )}

        {/* Modal de confirmation pour supprimer l'événement */}
        {isDeleteModalOpen && event && (
          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteEvent}
            title={`Supprimer l'événement "${event.title}"`}
            message="Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et supprimera définitivement l'événement."
            confirmButtonText="Oui, supprimer"
            cancelButtonText="Annuler"
            error={deleteError}
          />
        )}
      </div>
    </section>
  );
}
