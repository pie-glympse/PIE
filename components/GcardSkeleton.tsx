
interface GcardSkeletonProps {
  /** Même className que Gcard pour garder les mêmes dimensions (ex: "w-full h-60") */
  className?: string;
  /** Même valeur que backgroundSize sur Gcard (défaut 200) pour l’empreinte de l’image */
  backgroundSize?: number;
}

export default function GcardSkeleton({
  className = "",
  backgroundSize = 200,
}: GcardSkeletonProps) {
  return (
    <div
      className={`relative rounded-xl border border-gray-200 bg-white p-6 ${className}`}
      aria-hidden
    >
      <div className="relative z-10 animate-pulse">
        {/* Ligne titre + espace menu (même flex que Gcard) */}
        <div className="flex">
          <div className="h-6 w-3/4 max-w-[200px] rounded bg-gray-200" />
          <div className="ml-auto flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-200" />
            <div className="flex gap-0.5">
              <span className="h-1 w-1 rounded-full bg-gray-200 block" />
              <span className="h-1 w-1 rounded-full bg-gray-200 block" />
              <span className="h-1 w-1 rounded-full bg-gray-200 block" />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="mt-2 mb-4 h-4 w-24 rounded bg-gray-200" />

        {/* Avatars (5 cercles comme Gcard) */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-full border-2 border-white bg-gray-200"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Emplacement image de fond (mêmes dimensions que Gcard → pas de CLS) */}
      <div
        className="absolute right-0 bottom-0 overflow-hidden rounded-xl pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <div
          className="absolute right-[-25px] bottom-[-25px] rounded bg-gray-100"
          style={{ width: backgroundSize, height: 200 }}
        />
      </div>
    </div>
  );
}
