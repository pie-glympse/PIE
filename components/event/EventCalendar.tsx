"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { EventContentArg } from "@fullcalendar/core";
import type { EventType } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface EventCalendarProps {
  events: EventType[];
  currentUserId?: string;
}

const getThemeAccent = (themes: { techName: string }[] = []) => {
  if (themes.some((t) => t.techName.includes("restaurant"))) return "#FF8C42";
  if (themes.some((t) => t.techName.includes("bar"))) return "#7C3AED";
  if (themes.some((t) => t.techName.includes("park"))) return "#16A34A";
  return "#FCC638";
};

const getIllustration = (themes: { techName: string }[] = []) => {
  if (themes.some((t) => t.techName.includes("restaurant"))) return "/images/illustration/palm.svg";
  if (themes.some((t) => t.techName.includes("bar"))) return "/images/illustration/stack.svg";
  return "/images/illustration/roundstar.svg";
};

const getStateColor = (state?: string) => {
  switch (state?.toLowerCase()) {
    case "confirmed": return "#22c55e";
    case "pending":   return "#eab308";
    case "planned":   return "#3b82f6";
    default:          return "#9ca3af";
  }
};

function EventCard({ info }: { info: EventContentArg }) {
  const original: EventType = info.event.extendedProps.original;
  const accent = getThemeAccent(original.selectedGoogleTags || []);
  const illustration = getIllustration(original.selectedGoogleTags || []);
  const stateColor = getStateColor(original.state);

  return (
    <div
      className="relative w-full overflow-hidden rounded-l bg-white border border-gray-200 px-2 pt-1.5 pb-1 cursor-pointer hover:shadow-md transition-shadow duration-200 group"
      style={{ borderLeftWidth: "3px", borderLeftColor: accent }}
    >
      {/* Illustration décorative bottom-right — même principe que Gcard */}
      <div className="absolute right-[-6px] bottom-[-6px] w-10 h-10 pointer-events-none opacity-40">
        <Image
          src={illustration}
          alt=""
          aria-hidden="true"
          fill
          className="object-contain"
          sizes="40px"
        />
      </div>

      {/* Badge public */}
      {original.isPublic && (
        <span className="inline-flex mb-0.5 px-1.5 py-0 rounded-full bg-[#E9F1FE] text-[9px] font-poppins text-[var(--color-text)] leading-4">
          Public
        </span>
      )}

      {/* Titre + pastille état */}
      <div className="flex items-start justify-between gap-1 relative z-10">
        <span className="text-[11px] font-semibold font-urbanist text-gray-900 leading-tight line-clamp-2 flex-1">
          {info.event.title}
        </span>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: stateColor }}
        />
      </div>

      {/* Participants */}
      {original.users && original.users.length > 0 && (
        <p className="text-[9px] font-poppins text-gray-400 mt-0.5 relative z-10">
          {original.users.length} participant{original.users.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function EventCalendar({ events, currentUserId }: EventCalendarProps) {
  const router = useRouter();

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startDate || new Date().toISOString(),
    end: event.endDate || event.startDate || new Date().toISOString(),
    extendedProps: { original: event },
  }));

  return (
    <div className="event-calendar w-full">
      <style>{`
        /* Reset global FullCalendar */
        .event-calendar .fc-theme-standard td,
        .event-calendar .fc-theme-standard th,
        .event-calendar .fc-theme-standard .fc-scrollgrid {
          border-color: #f3f4f6 !important;
        }
        .event-calendar .fc-scrollgrid {
          border: none !important;
        }
        .event-calendar .fc-scrollgrid-section > td {
          border: none !important;
        }

        /* Typographie globale */
        .event-calendar .fc {
          font-family: var(--font-poppins), sans-serif;
        }

        /* Titre du mois */
        .event-calendar .fc-toolbar-title {
          font-family: var(--font-urbanist), sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text, #1a1a1a);
          text-transform: capitalize;
        }

        /* Reset du button-group Bootstrap de FullCalendar */
        .event-calendar .fc-button-group {
          display: inline-flex !important;
          gap: 8px !important;
        }
        .event-calendar .fc-button-group > .fc-button {
          margin-left: 0 !important;
          border-radius: 4px !important;
        }
        .event-calendar .fc-toolbar-chunk {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        /* Style des boutons — identique au Gcalendar */
        .event-calendar .fc-button {
          background-color: #e5e7eb !important;
          border: none !important;
          color: #374151 !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
          font-size: 0.75rem !important;
          font-family: var(--font-poppins), sans-serif !important;
          font-weight: 500 !important;
          line-height: 1.25rem !important;
          box-shadow: none !important;
          outline: none !important;
          transition: background-color 0.15s !important;
          cursor: pointer !important;
        }
        .event-calendar .fc-button:hover {
          background-color: #d1d5db !important;
          box-shadow: none !important;
        }
        .event-calendar .fc-button:focus,
        .event-calendar .fc-button:active,
        .event-calendar .fc-button:not(:disabled):active {
          background-color: #d1d5db !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .event-calendar .fc-button:disabled {
          background-color: #f3f4f6 !important;
          color: #9ca3af !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
        .event-calendar .fc-today-button {
          padding: 6px 12px !important;
        }
        .event-calendar .fc-icon {
          font-size: 1rem !important;
          line-height: 1.25rem !important;
          vertical-align: middle !important;
        }

        /* En-têtes des jours de la semaine */
        .event-calendar .fc-col-header-cell {
          border: none !important;
          background: transparent !important;
          padding-bottom: 8px;
        }
        .event-calendar .fc-col-header-cell-cushion {
          font-size: 0.7rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          text-decoration: none !important;
          letter-spacing: 0.05em;
        }

        /* Cellules des jours */
        .event-calendar .fc-daygrid-day {
          border-color: #f3f4f6 !important;
          background: transparent !important;
          min-height: 110px;
        }
        .event-calendar .fc-daygrid-day:hover {
          background-color: #fafafa !important;
        }
        .event-calendar .fc-day-other {
          opacity: 0.35;
        }

        /* Numéro du jour */
        .event-calendar .fc-daygrid-day-number {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none !important;
          padding: 6px 8px;
          line-height: 1;
        }

        /* Aujourd'hui */
        .event-calendar .fc-day-today {
          background-color: #fffdf5 !important;
        }
        .event-calendar .fc-day-today .fc-daygrid-day-number {
          background-color: #FCC638;
          color: #1a1a1a;
          font-weight: 700;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 4px;
        }

        /* Events */
        .event-calendar .fc-event {
          border: none !important;
          background: transparent !important;
          padding: 1px 4px;
          margin-bottom: 2px !important;
        }
        .event-calendar .fc-event:focus,
        .event-calendar .fc-event:focus-within {
          box-shadow: none !important;
          outline: none !important;
        }
        .event-calendar .fc-daygrid-event-harness {
          margin-bottom: 3px !important;
        }

        /* Lien "+X more" */
        .event-calendar .fc-more-link {
          font-size: 0.68rem;
          color: #9ca3af;
          font-family: var(--font-poppins), sans-serif;
          font-weight: 500;
          padding: 0 6px;
        }
        .event-calendar .fc-more-link:hover {
          color: #374151;
          text-decoration: none;
        }

        /* Popover "+X more" */
        .event-calendar .fc-popover {
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
          overflow: hidden;
        }
        .event-calendar .fc-popover-header {
          background: white !important;
          border-bottom: 1px solid #f3f4f6 !important;
          font-family: var(--font-urbanist), sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 10px 14px;
          color: var(--color-text, #1a1a1a);
          text-transform: capitalize;
        }
        .event-calendar .fc-popover-body {
          padding: 8px !important;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={frLocale}
        events={calendarEvents}
        eventContent={(info) => <EventCard info={info} />}
        eventClick={(info) => router.push(`/events/${info.event.id}`)}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        buttonText={{ today: "Aujourd'hui" }}
        dayMaxEvents={3}
        height="auto"
        eventDisplay="block"
      />
    </div>
  );
}
