interface UserListSkeletonProps {
  count?: number;
  isAdmin?: boolean;
}

export const UserListSkeleton = ({ count = 8, isAdmin = false }: UserListSkeletonProps) => {
  return (
    <div className="bg-white">
      {/* En-tête */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 animate-pulse">
        <div className="flex items-center">
          {isAdmin && <div className="w-8 flex justify-center"><div className="w-4 h-4 rounded bg-gray-200" /></div>}
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="h-4 w-12 rounded bg-gray-200" />
            <div className="h-4 w-12 rounded bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-6 py-4 animate-pulse">
            <div className="flex items-center">
              {isAdmin && <div className="w-8 flex justify-center"><div className="w-4 h-4 rounded bg-gray-200" /></div>}
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
