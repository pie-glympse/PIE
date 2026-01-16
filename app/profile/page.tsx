// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Camera } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isLoading, setUser } = useUser();

  const [banner, setBanner] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { logout } = useUser();
  const router = useRouter();

  // Données sauvegardées
  const [savedUserInfo, setSavedUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    companyId: "",
    teamName: "",
    photoUrl: "",
    bannerUrl: "",
  });

  // Données temporaires pour l'édition
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    companyId: "",
    teamName: "",
    photoUrl: "",
    bannerUrl: "",
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
          const errorData = await response.json();
          console.error("Erreur API:", errorData);
          throw new Error(errorData.error || "Erreur lors de la récupération des données utilisateur");
        }

        const userData = await response.json();

        const userDataFormatted = {
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          password: "", // Never show actual password
          role: userData.role || "",
          companyId: userData.companyId || "",
          teamName: userData.team?.name || "",
          photoUrl: userData.photoUrl || "",
          bannerUrl: userData.bannerUrl || "",
        };

        setSavedUserInfo(userDataFormatted);
        setUserInfo(userDataFormatted);

        // Set banner and avatar from saved URLs
        if (userData.bannerUrl && userData.bannerUrl.trim() !== "") {
          setBanner(userData.bannerUrl);
        } else {
          setBanner(null);
        }
        if (userData.photoUrl && userData.photoUrl.trim() !== "") {
          setAvatar(userData.photoUrl);
        } else {
          setAvatar(null);
        }
      } catch (error) {
        console.error("Erreur fetch user data:", error);
        alert("Erreur lors de la récupération des données utilisateur");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Afficher l'image temporairement pendant l'upload
      const tempUrl = URL.createObjectURL(file);
      setBanner(tempUrl);

      // Upload to server
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "banner"); // Spécifier le type

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const { url } = await response.json();

        // Sauvegarder immédiatement dans la base de données
        if (user) {
          const updateResponse = await fetch(`/api/users/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: savedUserInfo.firstName,
              lastName: savedUserInfo.lastName,
              email: savedUserInfo.email,
              bannerUrl: url,
              photoUrl: savedUserInfo.photoUrl,
            }),
          });

          if (!updateResponse.ok) {
            throw new Error("Erreur lors de la sauvegarde");
          }

          // Mettre à jour les états avec l'URL Supabase
          setBanner(url);
          setSavedUserInfo((prev) => ({ ...prev, bannerUrl: url }));

          // Libérer l'URL temporaire
          URL.revokeObjectURL(tempUrl);
        }
      } catch (error) {
        console.error("Error uploading banner:", error);
        alert(error instanceof Error ? error.message : "Erreur lors de l'upload de la bannière");
        // En cas d'erreur, remettre l'ancienne bannière
        setBanner(savedUserInfo.bannerUrl || null);
      }
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Afficher l'image temporairement pendant l'upload
      const tempUrl = URL.createObjectURL(file);
      setAvatar(tempUrl);

      // Upload to server
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "avatar"); // Spécifier le type

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const { url } = await response.json();

        // Sauvegarder immédiatement dans la base de données
        if (user) {
          const updateResponse = await fetch(`/api/users/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: savedUserInfo.firstName,
              lastName: savedUserInfo.lastName,
              email: savedUserInfo.email,
              photoUrl: url,
              bannerUrl: savedUserInfo.bannerUrl,
            }),
          });

          if (!updateResponse.ok) {
            throw new Error("Erreur lors de la sauvegarde");
          }

          // Mettre à jour les états avec l'URL Supabase
          setAvatar(url);
          setSavedUserInfo((prev) => ({ ...prev, photoUrl: url }));

          // Libérer l'URL temporaire
          URL.revokeObjectURL(tempUrl);
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        alert(error instanceof Error ? error.message : "Erreur lors de l'upload de la photo de profil");
        // En cas d'erreur, remettre l'ancien avatar
        setAvatar(savedUserInfo.photoUrl || null);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Copier les données sauvegardées vers les données temporaires
    setUserInfo({ ...savedUserInfo });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const updateData = {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        photoUrl: savedUserInfo.photoUrl,
        bannerUrl: savedUserInfo.bannerUrl,
        ...(userInfo.password && { password: userInfo.password }),
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const updatedUser = await response.json();

      // Sauvegarder les modifications
      setSavedUserInfo({ ...userInfo, photoUrl: savedUserInfo.photoUrl, bannerUrl: savedUserInfo.bannerUrl });
      setIsEditing(false);

      // Update user context
      setUser({
        ...user,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      });

      // Update localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
        })
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des données");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Annuler les modifications et restaurer les données sauvegardées
    setUserInfo({ ...savedUserInfo });
    setIsEditing(false);
  };

  if (isLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      logout();
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      logout();
      router.push("/login");
    }
  };

  return (
    <div className="mt-24 p-10 max-w-7xl mx-auto">
      {/* Bannière */}
      <div className="relative h-48 rounded-lg bg-gray-200 group/banner cursor-pointer">
        {banner && <Image src={banner} alt="Bannière" fill className="object-cover rounded-lg" />}
        {/* Overlay avec icône caméra - visible seulement au hover */}
        <div className="absolute inset-0 rounded-lg bg-black/30 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <label className="cursor-pointer p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <Camera size={24} className="text-white" />
            <input type="file" className="hidden" onChange={handleBannerChange} accept="image/*" />
          </label>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6 bg-amber-400 rounded-full">
          <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden group/avatar cursor-pointer">
            {avatar ? (
              <Image src={avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
            {/* Overlay avec icône caméra pour l'avatar */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full">
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
        <h2 className="text-xl font-semibold font-poppins">
          {savedUserInfo.firstName} {savedUserInfo.lastName}
        </h2>
        <p className="font-poppins font-medium">
          {savedUserInfo.teamName ? `Équipe ${savedUserInfo.teamName}` : "Pas d'équipe définie"}
        </p>

        {/* Boutons */}
        <div className="mt-4 flex space-x-4">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-transparent border-2 border-[var(--color-main)] text-[var(--color-main)] hover:bg-[var(--color-main)]/10 text-h3 font-poppins rounded-lg transition cursor-pointer"
              >
                Editer le profil
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-[var(--color-secondary)] text-h3 font-poppins text-white rounded-lg hover: transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sauvegarde..." : "Enregistrer"}
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
              <label className="block mb-2">Prénom</label>
              <input
                type="text"
                value={userInfo.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? "bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]" : "bg-white"
                }`}
              />
            </div>
            <div className="flex-1">
              <label className="block  mb-2">Nom</label>
              <input
                type="text"
                value={userInfo.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? "bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Second Row: Email and Password */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block  mb-2">Adresse email</label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  !isEditing ? "bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]" : "bg-white"
                }`}
              />
            </div>
            <div className="flex-1 relative">
              <label className="block  mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={userInfo.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Laissez vide pour conserver le mot de passe actuel"
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    !isEditing ? "bg-gray-100 cursor-not-allowed text-[var(--color-grey-three)]" : "bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!isEditing}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    !isEditing
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-[var(--color-grey-three)] hover:text-gray-700"
                  }`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 px-6 py-3 bg-[var(--color-secondary)] text-white font-poppins rounded-lg hover:bg-red-600 transition cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
