export const TeamsSidebarSkeleton = () => {
  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 animate-pulse">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="h-4 w-28 rounded bg-gray-200 mt-2" />
      </div>

      {/* Liste des teams */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-100 animate-pulse">
              <div className="h-4 w-32 rounded bg-gray-200 mb-1" />
              <div className="h-3 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Bouton créer */}
      <div className="p-4 border-t border-gray-200">
        <div className="h-11 w-full rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
};
