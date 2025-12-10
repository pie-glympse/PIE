import Gcard from "@/components/Gcard";
import type { EventType } from "@/hooks/useEvents";

interface EventListProps {
  events: EventType[];
  viewMode: 'grid' | 'list';
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
            className="w-16 h-60 flex items-center justify-center relative bg-white hover:bg-gray-50 transition rounded-xl"
          >
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 240"
              preserveAspectRatio="none"
            >
              <rect
                x="2"
                y="2"
                width="96"
                height="236"
                rx="12"
                fill="none"
                stroke="#FCC638"
                strokeWidth="2"
                strokeDasharray="12 8"
              />
            </svg>
            <span className="relative z-10 text-6xl text-yellow-400 font-light">+</span>
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

