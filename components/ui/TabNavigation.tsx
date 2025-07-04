interface Tab {
    id: string;
    label: string;
    active: boolean;
  }
  
  interface TabNavigationProps {
    tabs: Tab[];
    onTabChange: (tabId: string) => void;
  }
  
  const TabNavigation = ({ tabs, onTabChange }: TabNavigationProps) => {
    return (
      <div className="w-full">
        {/* Buttons avec underline sur le texte */}
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-3 font-poppins text-body-large transition-colors ${
                tab.active
                  ? 'text-[var(--color-text)] underline decoration-[var(--color-text)] decoration-2 underline-offset-2'
                  : 'text-[var(--color-grey-three)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Border séparée en dessous */}
        <div className="border-b border-gray-200 border-2 w-full "></div>
      </div>
    );
  };
  
  export default TabNavigation;