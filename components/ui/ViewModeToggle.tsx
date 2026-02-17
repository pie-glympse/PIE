import Image from "next/image";

interface ViewModeToggleProps {
  currentMode: 'grid' | 'list';
  onModeChange: (mode: 'grid' | 'list') => void;
}

export const ViewModeToggle = ({ currentMode, onModeChange }: ViewModeToggleProps) => {
  return (
    <div className="hidden md:flex flex-row items-center gap-4">
      <button className="cursor-pointer">
        <Image src="/icons/calendar.svg" alt="Vue Calendrier" width={24} height={24} sizes="24px" />
      </button>
      <button
        className={`p-2 rounded cursor-pointer ${currentMode === 'list' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
        onClick={() => onModeChange('list')}
      >
        <Image src="/icons/list.svg" alt="Vue Liste" width={24} height={24} sizes="24px" />
      </button>
      <button
        className={`p-2 rounded cursor-pointer ${currentMode === 'grid' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
        onClick={() => onModeChange('grid')}
      >
        <Image src="/icons/grid.svg" alt="Vue grid" width={24} height={24} sizes="24px" />
      </button>
    </div>
  );
};

