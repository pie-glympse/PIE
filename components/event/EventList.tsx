import Gcard from "@/components/Gcard";
import type { EventType } from "@/hooks/useEvents";
import {
    getEventCategoryStyle,
    formatEventCreatedAt,
} from "@/lib/event-display";
import { canShowEventPreferencesVote } from "@/lib/event-public";

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
  onEdit?: (eventId: string) => void;
  onShowAddEvent?: () => void;
  showAddButton?: boolean;
  onLeaveEvent?: (event: EventType) => void;
  currentUserId?: string;
  onParticipate?: (event: EventType) => void;
  joiningEventId?: string | null;
}

const adaptEventForGcard = (event: EventType) => {
  const categoryStyle = getEventCategoryStyle(event.category?.slug);
  return {
    title: event.title,
    date: formatEventCreatedAt(event.createdAt) || new Date().toISOString(),
    description: event.description,
    documentCount: event.documentCount,
    participants: event.users || [],
    backgroundUrl: categoryStyle.icon,
    accentColor: categoryStyle.color,
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
  onLeaveEvent,
  currentUserId,
  onParticipate,
  joiningEventId,
}: EventListProps) => {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          // Comparer les IDs en tant que strings pour éviter les problèmes de type
          const isCreator = !!(
            event.createdBy?.id &&
            currentUserId &&
            String(event.createdBy.id) === String(currentUserId)
          );
          const isParticipant =
            event.users?.some(
              (user) => String(user.id) === String(currentUserId),
            ) || false;
          const canLeave = !isCreator && isParticipant;
          const userIsParticipant =
            (event.isParticipant ?? isParticipant) || isCreator;

          return (
            <div key={event.id}>
              <Gcard
                eventId={event.id}
                {...adaptEventForGcard(event)}
                className="w-full h-full min-h-60"
                dropdownOpen={dropdownEvent === event.id}
                onDropdownToggle={() => onDropdownToggle(event.id)}
                isAuthorized={isAuthorized}
                onShare={() => onShare(event.id, event.title)}
                onPreferences={() => onPreferences(event)}
                onDelete={() => onDelete(event.id)}
                onEdit={
                  onEdit && isCreator ? () => onEdit(event.id) : undefined
                }
                canLeave={canLeave}
                onLeave={
                  canLeave && onLeaveEvent
                    ? () => onLeaveEvent(event)
                    : undefined
                }
                isCreator={isCreator}
                showPreferencesButton={canShowEventPreferencesVote({
                  isParticipant: userIsParticipant,
                  isCreator,
                  hasPreferences: userEventPreferences.has(event.id),
                  state: event.state,
                })}
                isPublic={event.isPublic}
                participantCount={
                  event.participantCount ?? event.users?.length ?? 0
                }
                maxParticipants={
                  event.maxParticipants ??
                  (event.maxPersons ? Number(event.maxPersons) : null)
                }
                isParticipant={userIsParticipant}
                hasVoted={userEventPreferences.has(event.id)}
                isFull={event.isFull}
                joinLoading={joiningEventId === event.id}
                hideParticipateButton={isCreator}
                onParticipate={
                  onParticipate && event.isPublic && !isCreator
                    ? () => onParticipate(event)
                    : undefined
                }
              />
            </div>
          );
        })}
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
            <span className="relative z-10 text-6xl text-yellow-400 font-light">
              +
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        // Comparer les IDs en tant que strings pour éviter les problèmes de type
        const isCreator = !!(
          event.createdBy?.id &&
          currentUserId &&
          String(event.createdBy.id) === String(currentUserId)
        );
        const isParticipant =
          event.users?.some(
            (user) => String(user.id) === String(currentUserId),
          ) || false;
        const canLeave = !isCreator && isParticipant;
        const userIsParticipant =
          (event.isParticipant ?? isParticipant) || isCreator;

        return (
          <div key={event.id}>
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
              onEdit={onEdit && isCreator ? () => onEdit(event.id) : undefined}
              canLeave={canLeave}
              onLeave={
                canLeave && onLeaveEvent ? () => onLeaveEvent(event) : undefined
              }
              isCreator={isCreator}
              showPreferencesButton={canShowEventPreferencesVote({
                isParticipant: userIsParticipant,
                isCreator,
                hasPreferences: userEventPreferences.has(event.id),
                state: event.state,
              })}
              isPublic={event.isPublic}
              participantCount={
                event.participantCount ?? event.users?.length ?? 0
              }
              maxParticipants={
                event.maxParticipants ??
                (event.maxPersons ? Number(event.maxPersons) : null)
              }
              isParticipant={userIsParticipant}
              hasVoted={userEventPreferences.has(event.id)}
              isFull={event.isFull}
              joinLoading={joiningEventId === event.id}
              hideParticipateButton={isCreator}
              onParticipate={
                onParticipate && event.isPublic && !isCreator
                  ? () => onParticipate(event)
                  : undefined
              }
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
