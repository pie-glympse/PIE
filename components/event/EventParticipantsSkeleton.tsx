interface EventParticipantsSkeletonProps {
  count?: number;
}

const EventParticipantsSkeleton = ({ count = 6 }: EventParticipantsSkeletonProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
          style={{ borderColor: "#F4F4F4" }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
            {/* Nom + email */}
            <div className="space-y-2">
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="h-4 w-36 rounded bg-gray-200" />
            </div>
          </div>
          {/* 3 points */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-200" />
            <div className="w-1 h-1 rounded-full bg-gray-200" />
            <div className="w-1 h-1 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventParticipantsSkeleton;
