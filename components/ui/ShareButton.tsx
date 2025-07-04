interface ShareButtonProps {
    onClick?: () => void;
    className?: string;
  }
  
  const ShareButton = ({ onClick, className = "" }: ShareButtonProps) => {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 bg-[var(--color-grey-one)] text-[var(--color-grey-four)] text-body-large  font-poppins hover:opacity-90 transition-opacity ${className}`}
        style={{borderRadius: '4px' }}
      >
        Partager
      </button>
    );
  };
  
  export default ShareButton;