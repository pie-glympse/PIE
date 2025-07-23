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

type EventDetails = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  maxPersons?: string;
  costPerPerson?: string;
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
  const id = params.id as string;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("informations");

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

  const organizer = event.users?.[0];

  return (
    <section className="flex flex-row h-screen items-start gap-10 p-10">
      <div className="h-full w-full flex flex-col gap-6 items-start p-10">
        {/* Header avec logo et back arrow */}
        <BackArrow onClick={handleBack} className="" />

        {/* Header de l'événement */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">
              {event.title}
            </h1>
            <p className="text-body-large font-poppins text-[var(--color-text)]">
              Organisé par {`${organizer?.firstName} ${organizer?.lastName}` || "Organisateur inconnu"}
            </p>
          </div>
          <ShareButton onClick={handleShare} />
        </div>

        {/* Navigation par onglets */}
        <div className="w-full">
          <TabNavigation tabs={tabs} onTabChange={handleTabChange} />
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="w-full flex-1 overflow-auto">{renderTabContent()}</div>

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
