import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full">
      <div className="mx-auto flex items-center justify-between ">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-4">
          {/* Menu button */}
          <button
            className="w-10 h-10 flex items-center justify-center"
            aria-label="Ouvrir le menu"
            type="button"
          >
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
              {[...Array(9)].map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                />
              ))}
            </div>
          </button>

          {/* Logo */}
          <Link href="/" aria-label="Retour à l'accueil">
            <Image
              src="/images/Qrcode.svg"
              alt="Logo Glymps"
              width={60}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* Right: Avatars */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-gray-200 border border-white" />
          <div className="w-12 h-12 rounded-full bg-gray-200 border border-white" />
        </div>
      </div>
    </header>
  );
}
