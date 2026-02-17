import Image from "next/image";
import MainButton from "@/components/ui/MainButton";

interface EmptyStateProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const EmptyState = ({
  title = "Aucun événement trouvé",
  message = "Il semble qu'il n'y ait aucun événement correspondant à vos critères. Pourquoi ne pas créer le premier ?",
  buttonText = "Créer mon premier événement",
  onButtonClick,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-96 pb-16">
      <div className="text-center space-y-3">
        <Image
          src="/images/mascotte/sad.png"
          alt="Mascotte triste"
          width={240}
          height={240}
          className="mx-auto object-contain w-60 h-60"
          sizes="(max-width: 640px) 200px, 240px"
          quality={85}
          loading="lazy"
        />
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-gray-800 font-urbanist">
            {title}
          </h3>
          <p className="text-gray-500 text-lg max-w-md mx-auto font-poppins">
            {message}
          </p>
        </div>
        {onButtonClick && (
          <div className="pt-4">
            <MainButton
              onClick={onButtonClick}
              text={buttonText}
              color={"bg-[var(--color-main)]"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

