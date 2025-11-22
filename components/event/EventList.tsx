import Gcard from "@/components/Gcard";
import type { EventType } from "@/hooks/useEvents";

interface EventListProps {
  events: EventType[];
  viewMode: "grid" | "list";
  dropdownEvent: string | null;
  onDropdownToggle: (eventId: string) => void;
  isAuthorized: boolean;
  userEventPreferences: Set<string>;
  onEventClick: (eventId: string) => void;
  onShare: (eventId: string, eventTitle: string) => void;
  onPreferences: (event: EventType) => void;
  onDelete: (eventId: string) => void;
  onLeaveEvent: (event: EventType) => void;
  currentUserId: string;
  onShowAddEvent?: () => void;
  showAddButton?: boolean;
}

const adaptEventForGcard = (event: EventType) => {
  const getBackgroundUrl = (tags: { id: string; name: string }[]) => {
    if (tags.some((tag) => tag.name === "Restauration")) return "/images/illustration/palm.svg";
    if (tags.some((tag) => tag.name === "Afterwork")) return "/images/illustration/stack.svg";
    if (tags.some((tag) => tag.name === "Team Building")) return "/images/illustration/roundstar.svg";
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
  onLeaveEvent,
  currentUserId,
  onShowAddEvent,
  showAddButton = true,
}: EventListProps) => {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const isParticipant = event.users?.some((participant) => participant.id === currentUserId);
          const isCreator = event.createdBy?.id === currentUserId;
          const canLeave = Boolean(isParticipant && !isCreator);

          return (
            <div key={event.id} onClick={() => onEventClick(event.id)} className="cursor-pointer">
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
                canLeave={canLeave}
                onLeave={canLeave ? () => onLeaveEvent(event) : undefined}
                showPreferencesButton={
                  !userEventPreferences.has(event.id) && event.state?.toLowerCase() !== "confirmed"
                }
              />
            </div>
          );
        })}
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
      {events.map((event) => {
        const isParticipant = event.users?.some((participant) => participant.id === currentUserId);
        const isCreator = event.createdBy?.id === currentUserId;
        const canLeave = Boolean(isParticipant && !isCreator);

        return (
          <div key={event.id} onClick={() => onEventClick(event.id)} className="cursor-pointer">
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
              canLeave={canLeave}
              onLeave={canLeave ? () => onLeaveEvent(event) : undefined}
              showPreferencesButton={!userEventPreferences.has(event.id) && event.state?.toLowerCase() !== "confirmed"}
            />
          </div>
        );
      })}
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
