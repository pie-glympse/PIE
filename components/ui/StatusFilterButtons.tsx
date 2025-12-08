interface StatusFilterButtonsProps {
  currentFilter: 'all' | 'past' | 'upcoming' | 'preparation';
  onFilterChange: (filter: 'all' | 'past' | 'upcoming' | 'preparation') => void;
}

export const StatusFilterButtons = ({ currentFilter, onFilterChange }: StatusFilterButtonsProps) => {
  const filters = [
    { id: 'all' as const, label: 'Tous' },
    { id: 'past' as const, label: 'Passés' },
    { id: 'upcoming' as const, label: 'À venir' },
    { id: 'preparation' as const, label: 'En préparation' },
  ];

  return (
    <div className="flex flex-row items-center gap-4 w-full flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`px-2 py-1 rounded text-body-large cursor-pointer ${
            currentFilter === filter.id
              ? 'bg-black text-white'
              : 'bg-[var(--color-grey-one)] text-[var(--color-text)]'
          }`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

