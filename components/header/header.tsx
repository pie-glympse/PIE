"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {

  const [isMenuHovered, setIsMenuHovered] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full p-6 bg-white z-50 border-b border-gray-100">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex items-center relative">
          {/* Menu button */}
          <div
            className="relative p-2"
            onMouseEnter={() => setIsMenuHovered(true)}
            onMouseLeave={() => setIsMenuHovered(false)}
          >
            <button
              className="w-10 h-10 flex items-center justify-center"
              aria-label="Ouvrir le menu"
              type="button"
            >
              <div className="flex flex-col gap-1.5 cursor-pointer">
                <span
                  className={`w-7 h-1 rounded-full transition-all duration-200 ${
                    isMenuHovered ? "bg-gray-700" : "bg-gray-500"
                  }`}
                />
                <span
                  className={`w-7 h-1 rounded-full transition-all duration-200 ${
                    isMenuHovered ? "bg-gray-700" : "bg-gray-500"
                  }`}
                />
                <span
                  className={`w-5 h-1 rounded-full transition-all duration-200 ${
                    isMenuHovered ? "bg-gray-700" : "bg-gray-500"
                  }`}
                />
              </div>
            </button>

            {/* Sidebar */}
            <div
              className={`absolute top-full left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 transform ${
                isMenuHovered
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setIsMenuHovered(true)}
              onMouseLeave={() => setIsMenuHovered(false)}
            >
              <Link
                href="/profile"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors duration-200 group"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-500 group-hover:text-secondary transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium">Profil</span>
              </Link>
              <Link
                href="/home"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors duration-200 group"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-500 group-hover:text-secondary transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="font-medium">Accueil</span>
              </Link>

              <Link
                href="/events"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors duration-200 group"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-500 group-hover:text-secondary transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Événements</span>
              </Link>
            </div>
          </div>

          {/* Logo */}
          <Link href="/home" aria-label="Retour à l'accueil" className="ml-4">
            <Image
              src="/images/logo/Logotype.svg"
              alt="Logo Glymps"
              width={150}
              height={150}
              priority
            />
          </Link>
        </div>

        {/* Right: Avatars */}
        <div className="flex items-center gap-8">
          <div className="w-10 h-10 relative cursor-pointer">
            <Image
              src="/images/icones/notification.svg"
              alt="notification"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-sm"
            />
            <span className="absolute top-0 right-0 bg-[var(--color-tertiary)] text-white text-xs font-medium px-1 rounded-full">
              3
            </span>
          </div>
          <Link
            href="/profile"
            className="w-12 h-12 rounded-full transition ease-in-out bg-gray-200 hover:bg-gray-300 border border-white"
          >
            <Image
              src="/images/mascotte/joy.png"
              alt="Avatar utilisateur"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}