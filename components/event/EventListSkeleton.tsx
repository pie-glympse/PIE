import GcardSkeleton from "@/components/GcardSkeleton";

interface EventListSkeletonProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export const EventListSkeleton = ({ count = 6, viewMode = "grid" }: EventListSkeletonProps) => {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <GcardSkeleton key={i} className="w-full h-60" backgroundSize={200} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <GcardSkeleton key={i} className="w-full" backgroundSize={200} />
      ))}
    </div>
  );
};
