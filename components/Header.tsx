"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

export default function Header() {
  const { user } = useUser();
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger le nombre de notifications non lues depuis l'API
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/notifications?userId=${user.id}`);
          if (response.ok) {
            const notifications = await response.json();
            const count = notifications.filter((n: any) => !n.read).length;
            setUnreadCount(count);
          }
        } catch (error) {
          console.error("Erreur récupération compteur:", error);
        }
      }
    };

    // Initialiser le compteur
    fetchUnreadCount();

    // Écouter les changements de notifications
    const handleUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('notificationsUpdated', handleUpdate);
    };
  }, [user]);

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
              <Link
                href="/create-groups"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors duration-200 group"
              >
               <svg fill="currentColor" className="w-5 h-5 mr-3 text-gray-500 group-hover:text-secondary transition-colors duration-200" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M16 6C14.3432 6 13 7.34315 13 9C13 10.6569 14.3432 12 16 12C17.6569 12 19 10.6569 19 9C19 7.34315 17.6569 6 16 6ZM11 9C11 6.23858 13.2386 4 16 4C18.7614 4 21 6.23858 21 9C21 10.3193 20.489 11.5193 19.6542 12.4128C21.4951 13.0124 22.9176 14.1993 23.8264 15.5329C24.1374 15.9893 24.0195 16.6114 23.5631 16.9224C23.1068 17.2334 22.4846 17.1155 22.1736 16.6591C21.1979 15.2273 19.4178 14 17 14C13.166 14 11 17.0742 11 19C11 19.5523 10.5523 20 10 20C9.44773 20 9.00001 19.5523 9.00001 19C9.00001 18.308 9.15848 17.57 9.46082 16.8425C9.38379 16.7931 9.3123 16.7323 9.24889 16.6602C8.42804 15.7262 7.15417 15 5.50001 15C3.84585 15 2.57199 15.7262 1.75114 16.6602C1.38655 17.075 0.754692 17.1157 0.339855 16.7511C-0.0749807 16.3865 -0.115709 15.7547 0.248886 15.3398C0.809035 14.7025 1.51784 14.1364 2.35725 13.7207C1.51989 12.9035 1.00001 11.7625 1.00001 10.5C1.00001 8.01472 3.01473 6 5.50001 6C7.98529 6 10 8.01472 10 10.5C10 11.7625 9.48013 12.9035 8.64278 13.7207C9.36518 14.0785 9.99085 14.5476 10.5083 15.0777C11.152 14.2659 11.9886 13.5382 12.9922 12.9945C11.7822 12.0819 11 10.6323 11 9ZM3.00001 10.5C3.00001 9.11929 4.1193 8 5.50001 8C6.88072 8 8.00001 9.11929 8.00001 10.5C8.00001 11.8807 6.88072 13 5.50001 13C4.1193 13 3.00001 11.8807 3.00001 10.5Z"/> </g>
                </svg>

                <span className="font-medium">Entreprise</span>
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
          <Link href="/notifications" className="w-10 h-10 relative cursor-pointer hover:opacity-80 transition">
            <Image
              src="/images/icones/notification.svg"
              alt="notification"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-sm"
            />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-[var(--color-tertiary)] text-white text-xs font-medium px-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
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