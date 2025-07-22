// app/profile/page.tsx (si tu es en app directory avec Next.js 13+)
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Camera } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";

type UserInfo = {
  name: string;
  email: string;
  password: string;
  photoUrl: string;
};

export default function ProfilePage() {
  const { user, isLoading, setUser } = useUser();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Données sauvegardées (from backend)
  const [savedUserInfo, setSavedUserInfo] = useState<UserInfo>({
    name: '',
    email: '',
    password: '',
    photoUrl: ''
  });

  // Données temporaires pour l'édition
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    email: '',
    password: '',
    photoUrl: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const response = await fetch(`/api/users/${user.id}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          throw new Error("Erreur lors de la récupération des données utilisateur");
        }
        
        const userData = await response.json();
        
        const userDataFormatted: UserInfo = {
          name: userData.name || '',
          email: userData.email || '',
          password: '', // Never show actual password
          photoUrl: userData.photoUrl || ''
        };
                
        setSavedUserInfo(userDataFormatted);
        setUserInfo(userDataFormatted);
        
        // Set avatar from backend data
        if (userData.photoUrl) {
          setAvatar(userData.photoUrl);
        }
        
      } catch (error) {
        console.error("Erreur fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      setUserInfo(prev => ({ ...prev, photoUrl: url }));
    }
  };

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setUserInfo({ ...savedUserInfo });
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Prepare data for backend - only include password if it's not empty
      const updateData: Partial<UserInfo> = {
        name: userInfo.name,
        email: userInfo.email,
        photoUrl: userInfo.photoUrl,
      };
      
      if (userInfo.password && userInfo.password.trim() !== '') {
        updateData.password = userInfo.password;
      }
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }
      
      const updatedUser = await response.json();
      
      // Update local state
      setSavedUserInfo({ ...userInfo });
      setIsEditing(false);
      
      // Update user context
      setUser({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email
      });
      
      // Update localStorage
      localStorage.setItem("user", JSON.stringify({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email
      }));
      
      console.log('Données sauvegardées:', userInfo);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des données");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUserInfo({ ...savedUserInfo });
    setAvatar(savedUserInfo.photoUrl || null);
    setIsEditing(false);
  };

  if (isLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 pt-24 max-w-7xl mx-auto">
      {/* Avatar Section */}
      <div className="relative h-48 rounded-lg bg-gray-200 flex items-center justify-center">
        <div className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden group cursor-pointer bg-gray-300">
          {avatar ? (
            <Image src={avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-xl">
                {savedUserInfo.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Overlay avec icône caméra pour l'avatar */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full">
            <label className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <Camera size={20} className="text-white" />
              <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
            </label>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-semibold font-poppins">
          {savedUserInfo.name}
        </h2>
        <p className="font-poppins font-medium text-gray-600">{savedUserInfo.email}</p>

        {/* Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          {!isEditing ? (
            <button 
              onClick={handleEdit}
              className="px-6 py-2 bg-blue-600 text-white font-poppins rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              Éditer le profil
            </button>
          ) : (
            <>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white font-poppins rounded-lg hover:bg-green-700 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button 
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-600 text-white font-poppins rounded-lg hover:bg-gray-700 transition cursor-pointer"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="mt-10 max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Informations personnelles</h3>
        
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-2 text-gray-700 font-poppins">
              Nom complet
            </label>
            <input
              type="text"
              value={userInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-gray-700 font-poppins">
              Adresse email
            </label>
            <input
              type="email"
              value={userInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-gray-700 font-poppins">
              Nouveau mot de passe (optionnel)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={userInfo.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Laissez vide pour ne pas changer"
                disabled={!isEditing}
                className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!isEditing}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  !isEditing ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}