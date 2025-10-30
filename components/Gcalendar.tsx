"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";

// Type pour les événements de l'API
interface APIEvent {
  id: string;
  uuid: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  maxPersons?: string;
  costPerPerson?: string;
  state?: string;
  activityType?: string; // ✅ Ajouter activityType
  tags: { id: string; name: string }[];
}

// Type pour les événements du calendrier
interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
  time: string;
  activityType?: string; // ✅ Ajouter activityType
  tags: { id: string; name: string }[];
  isMultiDay?: boolean;
  originalStartDate?: string;
  originalEndDate?: string;
  uuid?: string;
}

interface HoveredDay {
  day: number;
  month: number;
  year: number;
  events: Event[];
}

interface MonthInfo {
  name: string;
  month: number;
  year: number;
}

interface MiniCalendarProps {
  year?: number;
  eventsData?: Event[];
}

const MiniCalendar = ({ eventsData = [] }: MiniCalendarProps) => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredDayNumber, setHoveredDayNumber] = useState<{day: number, month: number} | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState<Event[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarMonths, setCalendarMonths] = useState<MonthInfo[]>([]);

  const monthNames = useMemo(() => [
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
  ], []);

  // Générer les mois du calendrier dynamiquement (d'aujourd'hui à dans un an)
  useEffect(() => {
    const today = new Date();
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    
    const months: MonthInfo[] = [];
    let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (currentDate <= oneYearFromNow) {
      months.push({
        name: monthNames[currentDate.getMonth()],
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      });
      // Passer au mois suivant
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    setCalendarMonths(months);
  }, [monthNames]);

  // Mapping des couleurs pour les types d'événements (activityType)
  const getColorForActivityType = (activityType: string): string => {
    const activityColors: Record<string, string> = {
      'Conférence': 'bg-[var(--color-main)] hover:bg-[#ca9e2d]',
      'Atelier': 'bg-[var(--color-secondary)] hover:bg-[#df4f4f]',
      'Séminaire': 'bg-[var(--color-tertiary)] hover:bg-[#c16bc7]',
      'Formation': 'bg-[var(--color-calendar-green)] hover:bg-[var(--color-calendar-green-hover)]',
      'Webinaire': 'bg-orange-500 hover:bg-orange-600',
    };

    return activityColors[activityType] || 'bg-[var(--color-calendar-grey)] hover:bg-[var(--color-calendar-grey-hover)]';
  };

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fonction pour générer tous les jours entre deux dates
  const generateDateRange = React.useCallback((startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, []);

  // Fonction pour convertir les événements de l'API au format du calendrier
  const convertAPIEventToCalendarEvent = React.useCallback((apiEvent: APIEvent): Event[] => {
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

    const startDate = formatDateForCalendar(apiEvent.startDate);
    const endDate = apiEvent.endDate ? formatDateForCalendar(apiEvent.endDate) : startDate;
    const isMultiDay = startDate !== endDate;

    // Si l'événement s'étend sur plusieurs jours, créer un événement pour chaque jour
    const dateRange = generateDateRange(startDate, endDate);
    
    return dateRange.map((date) => ({
      id: parseInt(apiEvent.id),
      date: date,
      title: apiEvent.title,
      description: apiEvent.description || '',
      time: getTimeFromDate(apiEvent.startDate),
      activityType: apiEvent.activityType, // ✅ Conserver activityType
      tags: apiEvent.tags,
      isMultiDay: isMultiDay,
      originalStartDate: startDate,
      originalEndDate: endDate,
      uuid: apiEvent.uuid
    }));
  }, [generateDateRange]);

  // Récupérer les événements depuis l'API
  useEffect(() => {
    if (!isLoading && user) {
      fetch(`/api/events?userId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
          return res.json();
        })
        .then((data: APIEvent[]) => {
          const convertedEvents: Event[] = [];
          data.forEach(apiEvent => {
            const eventDays = convertAPIEventToCalendarEvent(apiEvent);
            convertedEvents.push(...eventDays);
          });
          setEvents(convertedEvents);
          setFetchError(null);
        })
        .catch((err) => {
          setFetchError(err.message);
          console.error("Erreur lors du chargement des événements:", err);
        });
    }
  }, [isLoading, user, convertAPIEventToCalendarEvent]);

  // Utiliser les événements passés en props si disponibles
  useEffect(() => {
    if (eventsData.length > 0) {
      setEvents(eventsData);
    }
  }, [eventsData]);

  // Vérifier l'état du scroll pour afficher/masquer les boutons (seulement pour desktop)
  const checkScrollPosition = React.useCallback(() => {
    if (scrollContainerRef.current && !isMobile) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, [isMobile]);

  // Écouter les changements de scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && !isMobile) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      scrollContainer.addEventListener('scrollend', checkScrollPosition);
      checkScrollPosition();
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
        scrollContainer.removeEventListener('scrollend', checkScrollPosition);
      };
    }
  }, [isMobile, checkScrollPosition]);

  // Recalculer la position du scroll quand les mois changent
  useEffect(() => {
    if (calendarMonths.length > 0 && !isMobile) {
      // Petit délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        checkScrollPosition();
      }, 100);
    }
  }, [calendarMonths.length, isMobile, checkScrollPosition]);

  // Navigation avec les boutons flèches (seulement pour desktop)
  const scrollToDirection = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current && !isMobile) {
      const scrollAmount = 264; // Largeur d'un mois + gap
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const getDayEvents = (day: number, month: number, year: number): Event[] => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return events.filter((event) => event.date === dateKey);
  };

  const getDayColor = (day: number, month: number, year: number): string => {
    const dayEvents = getDayEvents(day, month, year);
    if (dayEvents.length === 0) return "bg-gray-200 hover:bg-gray-300";

    const firstEvent = dayEvents[0];
    
    if (firstEvent.activityType) {
      const color = getColorForActivityType(firstEvent.activityType);
      return color;
    }

    return 'bg-gray-400 hover:bg-gray-500';
  };

  // Fonction pour gérer le clic sur un jour avec événement
  const handleDayClick = (day: number, month: number, year: number) => {
    const dayEvents = getDayEvents(day, month, year);
    if (dayEvents.length > 0) {
      const firstEvent = dayEvents[0];
      if (firstEvent.uuid) {
        router.push(`/events/${firstEvent.id}`);
      }
    }
  };

  const handleMouseEnter = (
    day: number,
    month: number,
    year: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    setHoveredDayNumber({ day, month });
    const dayEvents = getDayEvents(day, month, year);
    if (dayEvents.length > 0) {
      setHoveredDay({ day, month, year, events: dayEvents });
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hoveredDay) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDayNumber(null);
    setHoveredDay(null);
  };

  const generateMonthDays = (month: number, year: number): React.ReactElement[] => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days: React.ReactElement[] = [];

    // Ajouter les jours vides au début
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6"></div>);
    }

    // Ajouter les jours du mois  
    for (let day = 1; day <= daysInMonth; day++) {
      const colorClass = getDayColor(day, month, year);
      const dayEvents = getDayEvents(day, month, year);
      const hasEvents = dayEvents.length > 0;

      days.push(
        <div
          key={day}
          className={`w-6 h-6 ${colorClass} cursor-pointer rounded-sm transition-colors duration-200 flex items-center justify-center text-xs font-medium text-white hover:transition-all hover:duration-300 hover:ease-in-out ${
            hasEvents ? 'hover:scale-110' : ''
          }`}
          onMouseEnter={(e) => handleMouseEnter(day, month, year, e)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleDayClick(day, month, year)}
        >
          {hoveredDayNumber?.day === day && hoveredDayNumber?.month === month ? day : ''}
        </div>
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
  if (isLoading || calendarMonths.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-gray-600 rounded-lg">
        Chargement du calendrier...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        {/* Boutons de navigation - cachés sur mobile */}
        {!isMobile && (
          <div className="flex gap-2">
            <button
              onClick={() => scrollToDirection('left')}
              disabled={!canScrollLeft}
              className={`z-10 p-2 rounded transition-all ${
                canScrollLeft 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Mois précédent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => scrollToDirection('right')}
              disabled={!canScrollRight}
              className={`z-10 p-2 rounded transition-all ${
                canScrollRight 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Mois suivant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Container de scroll avec tous les mois */}
      <div 
        ref={scrollContainerRef}
        className={`flex space-x-4 snap-x snap-mandatory px-1 py-5 gap-6 ${
          isMobile 
            ? 'overflow-x-auto'
            : 'overflow-x-auto' // ✅ Changer de 'overflow-hidden' à 'overflow-x-auto'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        {calendarMonths.map((monthInfo, index) => (
          <div
            key={`${monthInfo.name}-${monthInfo.year}-${index}`}
            className="min-w-[240px] p-3 rounded-lg snap-center shrink-0"
          >
            <h3 className="text-sm font-semibold text-left mb-2 text-gray-700">
              {monthInfo.name} {monthInfo.year}
            </h3>
            <div className="grid grid-cols-10 gap-1">
              {generateMonthDays(monthInfo.month, monthInfo.year)}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip des événements */}
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
            {hoveredDay.day} {monthNames[hoveredDay.month]} {hoveredDay.year}
          </div>
          <div className="space-y-1">
            {hoveredDay.events.map((event, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium">
                  {event.title}
                  {event.isMultiDay && (
                    <span className="ml-1 text-xs text-gray-400">
                      (Multi-jour)
                    </span>
                  )}
                </div>
                {event.description && (
                  <div className="text-gray-500 text-xs">
                    {event.description}
                  </div>
                )}
                {event.activityType && (
                  <div className="text-gray-400 text-xs">
                    Type: {event.activityType}
                  </div>
                )}
                {event.time && (
                  <div className="text-gray-400 text-xs">{event.time}</div>
                )}
                {/* Afficher les tags dans le tooltip si nécessaire */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {event.tags.map((tag) => (
                      <span 
                        key={tag.id}
                        className="px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
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