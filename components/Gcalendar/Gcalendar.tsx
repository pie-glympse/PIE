"use client";

import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useUser } from "../../context/UserContext";

// Type pour les événements de l'API
interface APIEvent {
  id: string;
  uuid: string;
  title: string;
  description?: string;
  date?: string;
  maxPersons?: string;
  costPerPerson?: string;
  state?: string;
  tags: { id: string; name: string }[];
}

// Type pour les événements du calendrier
interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
  time: string;
  type: "urgent" | "important" | "meeting" | "task" | "event";
}

interface HoveredDay {
  day: number;
  month: number;
  events: Event[];
}

interface MiniCalendarProps {
  year?: number;
  eventsData?: Event[];
}

const MiniCalendar = ({ year = 2025, eventsData = [] }: MiniCalendarProps) => {
  const { user, isLoading } = useUser();
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState<Event[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Fonction pour convertir les événements de l'API au format du calendrier
  const convertAPIEventToCalendarEvent = (apiEvent: APIEvent): Event => {
    // Déterminer le type basé sur les tags
    const getEventType = (tags: { id: string; name: string }[]): Event['type'] => {
      const tagNames = tags.map(tag => tag.name.toLowerCase());
      
      if (tagNames.includes('urgent')) return 'urgent';
      if (tagNames.includes('important')) return 'important';
      if (tagNames.includes('séminaire')) return 'meeting';
      if (tagNames.includes('team building')) return 'task';
      return 'event'; // Par défaut
    };

    // Extraire l'heure de la date
    const getTimeFromDate = (dateString?: string): string => {
      if (!dateString) return '00:00';
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // Formater la date pour le calendrier (YYYY-MM-DD)
    const formatDateForCalendar = (dateString?: string): string => {
      if (!dateString) return new Date().toISOString().split('T')[0];
      return new Date(dateString).toISOString().split('T')[0];
    };

    return {
      id: parseInt(apiEvent.id),
      date: formatDateForCalendar(apiEvent.date),
      title: apiEvent.title,
      description: apiEvent.description || '',
      time: getTimeFromDate(apiEvent.date),
      type: getEventType(apiEvent.tags)
    };
  };

  // Récupérer les événements depuis l'API
  useEffect(() => {
    if (!isLoading && user) {
      fetch(`/api/events?userId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
          return res.json();
        })
        .then((data: APIEvent[]) => {
          // Convertir les événements de l'API au format du calendrier
          const convertedEvents = data.map(convertAPIEventToCalendarEvent);
          setEvents(convertedEvents);
          setFetchError(null);
        })
        .catch((err) => {
          setFetchError(err.message);
          console.error("Erreur lors du chargement des événements:", err);
        });
    }
  }, [isLoading, user]);

  // Utiliser les événements passés en props si disponibles
  useEffect(() => {
    if (eventsData.length > 0) {
      setEvents(eventsData);
    }
  }, [eventsData]);

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const getDayEvents = (day: number, month: number): Event[] => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return events.filter((event) => event.date === dateKey);
  };

  const getDayColor = (day: number, month: number): string => {
    const dayEvents = getDayEvents(day, month);
    if (dayEvents.length === 0) return "bg-gray-200 hover:bg-gray-300";

    const priority: Record<string, string> = {
      urgent: "bg-red-400 hover:bg-red-500",
      important: "bg-orange-400 hover:bg-orange-500",
      meeting: "bg-blue-400 hover:bg-blue-500",
      task: "bg-green-400 hover:bg-green-500",
      event: "bg-purple-400 hover:bg-purple-500",
    };

    for (const [type, color] of Object.entries(priority)) {
      if (dayEvents.some((event) => event.type === type)) {
        return color;
      }
    }

    return "bg-indigo-700 hover:bg-indigo-800";
  };

  const handleMouseEnter = (
    day: number,
    month: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const dayEvents = getDayEvents(day, month);
    if (dayEvents.length > 0) {
      setHoveredDay({ day, month, events: dayEvents });
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hoveredDay) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const generateMonthDays = (month: number): React.ReactElement[] => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days: React.ReactElement[] = [];

    // Ajouter les jours vides au début
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6"></div>);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const colorClass = getDayColor(day, month);
      days.push(
        <div
          key={day}
          className={`w-6 h-6 ${colorClass} cursor-pointer rounded-sm transition-colors duration-200 flex items-center justify-center text-xs font-medium`}
          onMouseEnter={(e) => handleMouseEnter(day, month, e)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        ></div>
      );
    }

    return days;
  };

  // Afficher un message d'erreur si nécessaire
  if (fetchError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Erreur lors du chargement des événements: {fetchError}
      </div>
    );
  }

  // Afficher un loading si en cours de chargement
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 text-gray-600 rounded-lg">
        Chargement du calendrier...
      </div>
    );
  }

  return (
    <div>
      <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-1 py-5 custom-scroll gap-6">
        {months.map((month, index) => (
          <div
            key={month}
            className="min-w-[240px]  p-3 rounded-lg snap-center shrink-0"
          >
            <h3 className="text-sm font-semibold text-left mb-2 text-gray-700">
              {month} {year}
            </h3>
            <div className="grid grid-cols-13 gap-2">
              {generateMonthDays(index)}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip pour afficher les événements */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-white text-gray-600 p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <div className="font-semibold text-sm mb-1">
            {hoveredDay.day} {months[hoveredDay.month]} {year}
          </div>
          <div className="space-y-1">
            {hoveredDay.events.map((event, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium">{event.title}</div>
                {event.description && (
                  <div className="text-gray-500 text-xs">
                    {event.description}
                  </div>
                )}
                {event.time && (
                  <div className="text-gray-400 text-xs">{event.time}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCalendar;