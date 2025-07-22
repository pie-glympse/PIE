"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Appeler l'API de logout
      await fetch("/api/logout", { method: "POST" });
      
      // Nettoyer le context
      logout();
      
      // Rediriger vers login
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Fallback: forcer la suppression et rediriger
      logout();
      router.push("/login");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full p-6 bg-white z-50 border-b border-gray-100">
      <div className="mx-auto flex items-center justify-between">
        {/* Left: Menu + Logo */}
        <div className="flex items-center ">
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
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
          >
            Se déconnecter
          </button>
          <div className="w-12 h-12 rounded-sm bg-gray-200 border border-white" />
          <Link href="/profile" className="w-12 h-12 rounded-full bg-gray-200 border border-white">
          </Link>
        </div>
      </div>
    </header>
  );
}