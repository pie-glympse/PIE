import Image from "next/image";

interface ViewModeToggleProps {
  currentMode: 'grid' | 'list' | 'calendar';
  onModeChange: (mode: 'grid' | 'list' | 'calendar') => void;
}

export const ViewModeToggle = ({ currentMode, onModeChange }: ViewModeToggleProps) => {
  return (
    <div className="hidden md:flex flex-row items-center gap-4">
      <button
        className={`p-2 rounded ${currentMode === 'calendar' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
        onClick={() => onModeChange('calendar')}
      >
        <Image src="/icons/calendar.svg" alt="Vue Calendrier" width={24} height={24} className="" />
      </button>
      <button
        className={`p-2 rounded ${currentMode === 'list' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
        onClick={() => onModeChange('list')}
      >
        <Image src="/icons/list.svg" alt="Vue Liste" width={24} height={24} className="" />
      </button>
      <button
        className={`p-2 rounded ${currentMode === 'grid' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
        onClick={() => onModeChange('grid')}
      >
        <Image src="/icons/grid.svg" alt="Vue grid" width={24} height={24} className="" />
      </button>
    </div>
  );
};

