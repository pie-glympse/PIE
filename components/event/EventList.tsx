import Gcard from "@/components/Gcard";
import type { EventType } from "@/hooks/useEvents";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useState, useMemo } from 'react';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

interface EventListProps {
  events: EventType[];
  viewMode: 'grid' | 'list' | 'calendar';
  dropdownEvent: string | null;
  onDropdownToggle: (eventId: string) => void;
  isAuthorized: boolean;
  userEventPreferences: Set<string>;
  onEventClick: (eventId: string) => void;
  onShare: (eventId: string, eventTitle: string) => void;
  onPreferences: (event: EventType) => void;
  onDelete: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onShowAddEvent?: () => void;
  showAddButton?: boolean;
  currentUserId?: string;
}

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
    date: event.startDate || new Date().toISOString(),
    participants: event.users || [],
    backgroundUrl: getBackgroundUrl(event.tags),
    state: event.state,
  };
};

// Fonction pour transformer les événements au format Calendar
const transformEventsForCalendar = (events: EventType[]) => {
  return events.map(event => {
    // Combiner date + heure pour start
    let startDateTime: Date;
    if (event.startDate && event.startTime) {
      const dateStr = event.startDate.split('T')[0];
      const timeStr = event.startTime.includes('T') 
        ? event.startTime.split('T')[1].substring(0, 8)
        : event.startTime;
      startDateTime = new Date(`${dateStr}T${timeStr}`);
    } else if (event.startDate) {
      startDateTime = new Date(event.startDate);
    } else {
      startDateTime = new Date();
    }

    // Combiner date + heure pour end
    let endDateTime: Date;
    if (event.endDate && event.endTime) {
      const dateStr = event.endDate.split('T')[0];
      const timeStr = event.endTime.includes('T') 
        ? event.endTime.split('T')[1].substring(0, 8)
        : event.endTime;
      endDateTime = new Date(`${dateStr}T${timeStr}`);
    } else if (event.endDate) {
      endDateTime = new Date(event.endDate);
    } else {
      // Si pas de date de fin, prendre 1h après le début
      endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    }

    return {
      ...event,
      start: startDateTime,
      end: endDateTime,
      title: event.title,
      resource: event, // Garder l'événement complet pour accès ultérieur
    };
  });
};

export const EventList = ({
  events,
  viewMode,
  dropdownEvent,
  onDropdownToggle,
  isAuthorized,
  userEventPreferences,
  onEventClick,
  onShare,
  onPreferences,
  onDelete,
  onEdit,
  onShowAddEvent,
  showAddButton = true,
  currentUserId,
}: EventListProps) => {
  // Vue Calendrier
  if (viewMode === 'calendar') {
    const [currentDate, setCurrentDate] = useState(new Date());
    const calendarEvents = useMemo(() => transformEventsForCalendar(events), [events]);

    // Composant personnalisé pour afficher les événements dans le calendrier
    const CustomEvent = ({ event }: any) => {
      const originalEvent = event.resource as EventType;
      
      return (
        <div 
          className="h-full overflow-hidden rounded-md px-2 py-0.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-main)',
            border: '2px solid var(--color-main)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEventClick(originalEvent.id);
          }}
        >
          <div className="text-xs font-semibold text-[var(--color-text)] truncate font-poppins">
            {event.title}
          </div>
        </div>
      );
    };

    const CustomToolbar = ({ label, onNavigate }: any) => {
      return (
        <div className="flex items-center justify-between mb-2 pb-2">
          
          <h2 className="text-h3 font-semibold text-gray-700">{label}</h2>
          <div>
          <button
            onClick={() => onNavigate('PREV')}
            className="z-10 p-2 rounded-lg transition-all bg-[var(--color-grey-one)] hover:bg-[var(--color-grey-two)] text-[var(--color-text)] cursor-pointer"
            aria-label="Semaine précédente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="z-10 p-2 rounded-lg transition-all bg-[var(--color-grey-one)] hover:bg-[var(--color-grey-two)] text-[var(--color-text)] cursor-pointer ml-2"
            aria-label="Semaine suivante"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          </div>
        </div>
      );
    };

    return (
      <div className="h-[80vh]">
        <style jsx global>{`
          .rbc-calendar {
            font-family: var(--font-poppins);
          }
          .rbc-header {
            padding: 12px 4px;
            font-weight: 600;
            font-size: 14px;
            color: var(--color-grey-four);
            border-bottom: none;
            background-color: var(--color-grey-one);
          }
          .rbc-time-header-content {
            border-left: none;
            border-bottom: none;
          }
          .rbc-time-content {
            border-top: none;
          }
          .rbc-timeslot-group {
            min-height: 60px;
            border-bottom: 1px solid var(--color-grey-two);
          }
          .rbc-time-slot {  
            marging-right: 0;
          }
          .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid var(--color-grey-two);
          }
          .rbc-time-gutter {
            font-size: 13px;
            color: var(--color-grey-three);
          }
          .rbc-current-time-indicator {
            background-color: var(--color-secondary);
            height: 2px;
          }
          .rbc-today {
            background-color: var(--color-grey-two);
          }
          .rbc-event {
            background-color: var(--color-main);
            color: var(--color-text);
            font-size: 13px;
            font-weight: 500;
            padding: 4px; 
            border: none;
            padding: 10px;
            border-radius: 15px;
          }
          .rbc-event.rbc-selected {
            background-color: transparent;
          }
          .rbc-day-slot .rbc-events-container {
            margin-right: 0;  
          }
          .rbc-time-view {
            border-radius: 15px;
            overflow: hidden;
            border: none;
            background-color: var(--color-grey-one);
          }

        `}</style>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          defaultView="week"
          views={['week', 'day']}
          components={{
            event: CustomEvent,
            toolbar: CustomToolbar,
          }}
          onSelectEvent={(event: any) => {
            const originalEvent = event.resource as EventType;
            onEventClick(originalEvent.id);
          }}
          messages={{
            week: 'Semaine',
            day: 'Jour',
            today: "Aujourd'hui",
            previous: 'Précédent',
            next: 'Suivant',
            showMore: (total) => `+${total} plus`,
          }}
          formats={{
            dayHeaderFormat: (date) => moment(date).format('ddd DD/MM'),
            timeGutterFormat: (date) => moment(date).format('HH:mm'),
            eventTimeRangeFormat: ({ start, end }) =>
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
          }}
          min={new Date(2025, 0, 1, 8, 0, 0)}
          max={new Date(2025, 0, 1, 20, 0, 0)}
          style={{ height: 'calc(100% - 60px)' }}
        />
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event.id)}
            className="cursor-pointer"
          >
            <Gcard
              eventId={event.id}
              {...adaptEventForGcard(event)}
              className="w-full h-60"
              dropdownOpen={dropdownEvent === event.id}
              onDropdownToggle={() => onDropdownToggle(event.id)}
              isAuthorized={isAuthorized}
              onShare={() => onShare(event.id, event.title)}
              onPreferences={() => onPreferences(event)}
              onDelete={() => onDelete(event.id)}
              onEdit={onEdit ? () => onEdit(event.id) : undefined}
              createdById={event.createdById}
              currentUserId={currentUserId}
              showPreferencesButton={
                !userEventPreferences.has(event.id) && 
                event.state?.toLowerCase() !== 'confirmed'
              }
            />
          </div>
        ))}
        {showAddButton && onShowAddEvent && (
          <button
            onClick={onShowAddEvent}
            aria-label="Ajouter un évènement"
            className="w-full md:w-20 h-60 flex-shrink-0 flex items-center bg-[var(--color-main)] justify-center rounded-xl hover:opacity-80 transition text-h1 text-white"
          >
            +
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => onEventClick(event.id)}
          className="cursor-pointer"
        >
          <Gcard
            eventId={event.id}
            {...adaptEventForGcard(event)}
            className="w-full ha-auto"
            dropdownOpen={dropdownEvent === event.id}
            onDropdownToggle={() => onDropdownToggle(event.id)}
            isAuthorized={isAuthorized}
            onShare={() => onShare(event.id, event.title)}
            onPreferences={() => onPreferences(event)}
            onDelete={() => onDelete(event.id)}
            onEdit={onEdit ? () => onEdit(event.id) : undefined}
            createdById={event.createdById}
            currentUserId={currentUserId}
            showPreferencesButton={
              !userEventPreferences.has(event.id) && 
              event.state?.toLowerCase() !== 'confirmed'
            }
          />
        </div>
      ))}
      {showAddButton && onShowAddEvent && (
        <button
          onClick={onShowAddEvent}
          aria-label="Ajouter un évènement"
          className="w-full h-16 flex items-center justify-center bg-[var(--color-main)] text-white rounded-lg hover:opacity-80 transition text-lg font-semibold"
        >
          + Ajouter un événement
        </button>
      )}
    </div>
  );
};

