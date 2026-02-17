"use client";

import { useState, useEffect, FormEvent } from "react";
import type { ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import BackArrow from "@/components/ui/BackArrow";
import MainButton from "@/components/ui/MainButton";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useUser();
  const eventId = params.id as string;

  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les données de l'événement
  useEffect(() => {
    if (!isLoading && user && eventId) {
      fetch(`/api/events/${eventId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération de l'événement");
          return res.json();
        })
        .then((data) => {
          const event = data.event || data;
          
          // Formater les dates et heures pour les inputs
          const formatDate = (dateString: string | undefined) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };

          const formatTime = (timeString: string | undefined) => {
            if (!timeString) return '';
            const time = new Date(timeString);
            return time.toTimeString().split(' ')[0].substring(0, 5);
          };

          setTitle(event.title || "");
          setStartDate(formatDate(event.startDate));
          setEndDate(formatDate(event.endDate));
          setStartTime(formatTime(event.startTime));
          setEndTime(formatTime(event.endTime));
          setCity(event.city || "");
          setIsLoadingEvent(false);
        })
        .catch((err) => {
          setErrors({ general: err.message });
          setIsLoadingEvent(false);
        });
    }
  }, [isLoading, user, eventId]);

  // Redirection si pas connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Validation des dates et heures
  const validateDatesAndTimes = () => {
    const newErrors: {[key: string]: string} = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Validation date de début
    if (startDate && startDate < today) {
      newErrors.startDate = "La date de début ne peut pas être antérieure à aujourd'hui";
    }
    
    // Validation date de fin
    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate = "La date de fin ne peut pas être antérieure à la date de début";
    }
    
    // Validation des heures si même jour
    if (startDate && endDate && startTime && endTime && startDate === endDate) {
      if (endTime <= startTime) {
        newErrors.endTime = "L'heure de fin doit être postérieure à l'heure de début";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setErrors(prev => ({ ...prev, startDate: '', endDate: '' }));
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setErrors(prev => ({ ...prev, endDate: '' }));
  };

  const handleStartTimeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setStartTime(e.target.value);
    setErrors(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const handleEndTimeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setEndTime(e.target.value);
    setErrors(prev => ({ ...prev, endTime: '' }));
  };

  // Générer les options de temps (toutes les 30 minutes)
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Valider que la ville est renseignée
    if (!city || city.trim() === '') {
      setErrors({ general: 'La ville est obligatoire' });
      return;
    }
    
    // Valider les dates et heures
    if (!validateDatesAndTimes()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Préparer les données pour l'API
      const updateData = {
        title,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        startTime: startTime ? new Date(`1970-01-01T${startTime}`).toISOString() : null,
        endTime: endTime ? new Date(`1970-01-01T${endTime}`).toISOString() : null,
        city,
        userId: user?.id, // Ajouter l'ID de l'utilisateur pour la vérification
      };

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la modification");
      }

      // Rediriger vers la page de l'événement
      router.push(`/events/${eventId}`);
    } catch (err: any) {
      setErrors({ general: err.message });
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--color-grey-three)] font-poppins">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="overflow-y-auto md:overflow-hidden pt-24 flex flex-col items-center gap-10 p-10">
      <div className="h-full w-full flex flex-col gap-6 items-start p-10">
        <div>
          <BackArrow onClick={() => router.back()} className="" />
        </div>

        <form onSubmit={handleSubmit} className="w-full mx-auto">
          <h1 className="text-h1 mb-4 text-left md:w-2/3 w-full font-urbanist">
            Modifier l&apos;événement
          </h1>
          
          <h2 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
            Modifiez les informations de votre événement
          </h2>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded text-red-600 font-poppins">
              {errors.general}
            </div>
          )}
          
          {/* Nom de l'événement */}
          <div className="mb-4">
            <label htmlFor="title" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
              Nom de l&apos;événement
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de l'événement"
              required
              className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
            />
          </div>

          {/* Dates de début et fin (50-50) */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="startDate" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                Date de début
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins"
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1 font-poppins">{errors.startDate}</p>
              )}
            </div>
            
            <div className="flex-1">
              <label htmlFor="endDate" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                Date de fin
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins"
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1 font-poppins">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Heures de début et fin (50-50) */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="startTime" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                Heure de début
              </label>
              <select
                id="startTime"
                value={startTime}
                onChange={handleStartTimeChange}
                className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins"
              >
                <option value="">Sélectionner une heure</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1 font-poppins">{errors.startTime}</p>
              )}
            </div>
            
            <div className="flex-1">
              <label htmlFor="endTime" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                Heure de fin
              </label>
              <select
                id="endTime"
                value={endTime}
                onChange={handleEndTimeChange}
                className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins"
              >
                <option value="">Sélectionner une heure</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1 font-poppins">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Ville */}
          <div className="mb-4">
            <label htmlFor="city" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
              Ville
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Paris"
              required
              className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6 w-full md:w-1/2">
            <div className="flex-1">
              <MainButton
                text="Annuler"
                onClick={() => router.back()}
                color="bg-[var(--color-grey-two)] text-[var(--color-text)] font-poppins text-body-large"
                type="button"
              />
            </div>
            <div className="flex-1">
              <MainButton
                text={isSubmitting ? "Enregistrement..." : "Enregistrer"}
                onClick={() => {}}
                disabled={isSubmitting}
                color="bg-[var(--color-main)] text-white font-poppins text-body-large"
                type="submit"
              />
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
