import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">

        <div className="flex items-center">
          <button
            className="w-10 h-10 flex flex-col justify-center items-center mr-4"
            aria-label="Ouvrir le menu"
            type="button"
          >
            <div className="grid grid-cols-3 grid-rows-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full block"
                />
              ))}
            </div>
          </button>
          <Link href="/">
            <Image
              src="/images/Qrcode.svg"
              alt="Logo Glymps"
              width={60}
              height={40}
            />
          </Link>
        </div>
        <div className="flex">
          <div className="w-20 h-20  rounded-sm border-3 border-white object-cover bg-gray-200"></div>
          <div className="w-20 h-20  rounded-full border-3 border-white object-cover bg-gray-200"></div>
        </div>
      </div>
    </header>
  );
}
