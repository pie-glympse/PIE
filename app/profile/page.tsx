// app/profile/page.tsx (si tu es en app directory avec Next.js 13+)
"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Camera } from "lucide-react";

export default function ProfilePage() {
  const [banner, setBanner] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Données sauvegardées
  const [savedUserInfo, setSavedUserInfo] = useState({
    firstName: 'Kevin',
    lastName: 'Labatte',
    email: 'kevin.labatte@email.com',
    password: ''
  });

  // Données temporaires pour l'édition
  const [userInfo, setUserInfo] = useState({
    firstName: 'Kevin',
    lastName: 'Labatte',
    email: 'kevin.labatte@email.com',
    password: ''
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBanner(URL.createObjectURL(file));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Copier les données sauvegardées vers les données temporaires
    setUserInfo({ ...savedUserInfo });
  };

  const handleSave = () => {
    // Sauvegarder les modifications
    setSavedUserInfo({ ...userInfo });
    setIsEditing(false);
    console.log('Données sauvegardées:', userInfo);
  };

  const handleCancel = () => {
    // Annuler les modifications et restaurer les données sauvegardées
    setUserInfo({ ...savedUserInfo });
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Bannière */}
      <div className="relative h-48 rounded-lg bg-gray-200 group cursor-pointer">
        {banner && (
          <Image
            src={banner}
            alt="Bannière"
            fill
            className="object-cover rounded-lg"
          />
        )}
        {/* Overlay avec icône caméra - visible seulement au hover */}
        <div className="absolute inset-0 rounded-lg bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <label className="cursor-pointer p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <Camera size={24} className="text-white" />
            <input type="file" className="hidden" onChange={handleBannerChange} accept="image/*" />
          </label>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6 bg-amber-400 rounded-full">
          <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden group cursor-pointer">
            {avatar ? (
              <Image src={avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
            {/* Overlay avec icône caméra pour l'avatar */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full">
              <label className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <Camera size={16} className="text-white" />
                <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Infos utilisateur */}
      <div className="mt-16 ml-6">
        <h2 className="text-xl font-semibold font-poppins">{savedUserInfo.firstName} {savedUserInfo.lastName}</h2>
        <p className="font-poppins font-medium">Équipe Front-End Dev Jedi</p>

        {/* Boutons */}
        <div className="mt-4 flex space-x-4">
          {!isEditing ? (
            <>
              <button 
                onClick={handleEdit}
                className="px-4 py-2 bg-[var(--color-grey-one)] text-h3 font-poppins text-[var(--color-grey-three)] rounded-lg hover: transition cursor-pointer"
              >
                Editer le profil
              </button>
              <button className="px-4 py-2 bg-white text-h3 font-poppins text-[var(--color-grey-three)] border-2 border-[var(--color-grey-three)] rounded-lg hover: transition cursor-pointer">
                Parametres
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-[var(--color-grey-one)] text-h3 font-poppins text-[var(--color-grey-three)] rounded-lg hover: transition cursor-pointer"
              >
                Enregistrer
              </button>
              <button 
                onClick={handleCancel}
                className="px-4 py-2 bg-white text-h3 font-poppins text-[var(--color-grey-three)] border-2 border-[var(--color-grey-three)] rounded-lg hover: transition cursor-pointer"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <div className="mt-10 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Informations personnelles</h3>
        
        <div className="space-y-4 text-[var(--color-grey-three)] font-poppins text-body-large">
          {/* First Row: First Name and Last Name */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-2">
                Prénom
              </label>
              <input
                type="text"
                value={userInfo.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? 'bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]' : 'bg-white'
                }`}
              />
            </div>
            <div className="flex-1">
              <label className="block  mb-2">
                Nom
              </label>
              <input
                type="text"
                value={userInfo.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? 'bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Second Row: Email and Password */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block  mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? 'bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]' : 'bg-white'
                }`}
              />
            </div>
            <div className="flex-1 relative">
              <label className="block  mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={userInfo.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]' : 'bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!isEditing}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    !isEditing ? 'text-gray-400 cursor-not-allowed' : 'text-[var(--color-grey-three)] hover:text-gray-700'
                  }`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Seulement visible en mode édition */}
        {/* {isEditing && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Sauvegarder les modifications
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
}