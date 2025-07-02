"use client";

import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";


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


const mockEvents: Event[] = [
  {
    id: 1,
    date: "2024-01-15",
    title: "Réunion équipe marketing",
    description:
      "Point mensuel sur les campagnes en cours et planification des prochaines actions",
    time: "09:00",
    type: "meeting",
  },
  {
    id: 2,
    date: "2024-01-15",
    title: "Deadline projet Alpha",
    description: "Finalisation et livraison du projet Alpha au client",
    time: "17:00",
    type: "urgent",
  },
  {
    id: 3,
    date: "2024-01-22",
    title: "Formation React",
    description: "Session de formation avancée sur React et ses hooks",
    time: "14:00",
    type: "event",
  },
  {
    id: 4,
    date: "2024-02-05",
    title: "Révision de code",
    description: "Code review hebdomadaire avec l'équipe de développement",
    time: "10:30",
    type: "task",
  },
  {
    id: 5,
    date: "2024-02-14",
    title: "Présentation client",
    description: "Présentation du nouveau design au client principal",
    time: "16:00",
    type: "important",
  },
  {
    id: 6,
    date: "2024-02-28",
    title: "Rétrospective sprint",
    description: "Bilan du sprint terminé et planification du suivant",
    time: "11:00",
    type: "meeting",
  },
  {
    id: 7,
    date: "2024-03-08",
    title: "Maintenance serveur",
    description: "Maintenance programmée des serveurs de production",
    time: "02:00",
    type: "urgent",
  },
  {
    id: 8,
    date: "2024-03-15",
    title: "Atelier UX",
    description: "Atelier collaboratif sur l'expérience utilisateur",
    time: "13:30",
    type: "event",
  },
  {
    id: 9,
    date: "2024-04-01",
    title: "Lancement campagne",
    description: "Lancement officiel de la nouvelle campagne publicitaire",
    time: "08:00",
    type: "important",
  },
  {
    id: 10,
    date: "2024-04-10",
    title: "Audit sécurité",
    description: "Audit de sécurité trimestriel de l'infrastructure",
    time: "15:00",
    type: "task",
  },
  {
    id: 11,
    date: "2024-05-01",
    title: "Conférence tech",
    description:
      "Participation à la conférence annuelle sur les nouvelles technologies",
    time: "09:00",
    type: "event",
  },
  {
    id: 12,
    date: "2024-05-20",
    title: "Entretien candidat",
    description: "Entretien avec le candidat développeur senior",
    time: "14:30",
    type: "meeting",
  },
  {
    id: 13,
    date: "2024-06-03",
    title: "Fin de projet Beta",
    description: "Date limite pour la finalisation du projet Beta",
    time: "18:00",
    type: "urgent",
  },
  {
    id: 14,
    date: "2024-06-15",
    title: "Formation GraphQL",
    description: "Formation interne sur GraphQL et ses bonnes pratiques",
    time: "10:00",
    type: "event",
  },
  {
    id: 15,
    date: "2024-07-04",
    title: "Réunion budget",
    description: "Révision du budget trimestriel avec la direction",
    time: "11:00",
    type: "important",
  },
  {
    id: 16,
    date: "2024-08-12",
    title: "Test utilisateur",
    description: "Session de tests utilisateurs pour la nouvelle interface",
    time: "16:30",
    type: "task",
  },
  {
    id: 17,
    date: "2024-09-09",
    title: "Hackathon interne",
    description: "Hackathon de 24h pour explorer de nouvelles idées",
    time: "09:00",
    type: "event",
  },
  {
    id: 18,
    date: "2024-10-31",
    title: "Migration base de données",
    description: "Migration planifiée vers la nouvelle base de données",
    time: "22:00",
    type: "urgent",
  },
  {
    id: 19,
    date: "2024-11-15",
    title: "Bilan annuel",
    description: "Réunion de bilan annuel avec tous les départements",
    time: "14:00",
    type: "important",
  },
  {
    id: 20,
    date: "2024-12-20",
    title: "Fête de fin d'année",
    description: "Célébration de fin d'année avec toute l'équipe",
    time: "18:00",
    type: "event",
  },
];

const MiniCalendar = ({ year = 2024, eventsData = [] }: MiniCalendarProps) => {
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState<Event[]>(mockEvents); // use données mockées 

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

  // ici fecth les events depuis l'API
  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    }
  };

  useEffect(() => {

    if (eventsData.length === 0) {

    } else {
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
    if (dayEvents.length === 0) return "bg-gray-100 hover:bg-gray-200";

 
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

   
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6"></div>);
    }


    for (let day = 1; day <= daysInMonth; day++) {
      const colorClass = getDayColor(day, month);
      days.push(
        <div
          key={day}
          className={`w-6 h-6 ${colorClass} cursor-pointer rounded-sm  transition-colors duration-200 flex items-center justify-center text-xs font-medium`}
          onMouseEnter={(e) => handleMouseEnter(day, month, e)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        ></div>
      );
    }

    return days;
  };

  return (
    <div >
      <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-1 py-5 custom-scroll gap-6">
        {months.map((month, index) => (
          <div
            key={month}
            className="min-w-[240px] bg-gray-50 p-3 rounded-lg snap-center shrink-0"
          >
            <h3 className="text-sm font-semibold text-left mb-2 text-gray-700">
              {month} {year}
            </h3>
            <div className="grid grid-cols-12 gap-1">
              {generateMonthDays(index)}
            </div>
          </div>
        ))}
      </div>


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
