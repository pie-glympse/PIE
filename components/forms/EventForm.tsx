"use client";

import { useState, FormEvent, useEffect } from "react";
import type { FC, ReactNode, ChangeEvent } from "react";
import { useUser } from "@/context/UserContext";
import MainButton from "@/components/ui/MainButton";
import SimpleAutocomplete from "@/components/ui/SimpleAutocomplete";
import { PrincipalGroupPicker } from "@/components/event/ThemeGroupPicker";

type PrincipalGroup = {
  id: string;
  name: string;
  sortOrder: number;
};

interface EventFormProps {
  title: ReactNode;
  subtitle?: string;
  buttonText: string;
  initialData?: {
    title?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    maxPersons?: string;
    costPerPerson?: string;
    city?: string;
    maxDistance?: string;
    placeName?: string;
    placeAddress?: string;
    recurring?: boolean;
    duration?: string;
    recurringRate?: string;
    isSpecificPlace?: boolean;
    googleTagGroupIds?: string[];
    googleTagIds?: string[];
  };
  requireMaxPersons?: boolean;
  isSubmitting?: boolean;
  onSubmit: (formData: {
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    maxPersons: string;
    costPerPerson: string;
    city: string;
    maxDistance: string;
    placeName?: string;
    placeAddress?: string;
    recurring: boolean;
    duration: string;
    recurringRate: string;
    isSpecificPlace: boolean;
    googleTagGroupIds: string[];
    googleTagIds: string[];
  }) => void;
}

const EventForm: FC<EventFormProps> = ({
  title,
  subtitle,
  buttonText,
  initialData,
  requireMaxPersons = false,
  isSubmitting = false,
  onSubmit,
}) => {
  const { user } = useUser();
  const [eventTitle, setEventTitle] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [maxPersons, setMaxPersons] = useState(initialData?.maxPersons || "");
  const [costPerPerson, setCostPerPerson] = useState(
    initialData?.costPerPerson || "",
  );
  const [city, setCity] = useState(initialData?.city || "");
  const [maxDistance, setMaxDistance] = useState(
    initialData?.maxDistance || "",
  );
  const [placeName, setPlaceName] = useState(initialData?.placeName || "");
  const [placeAddress, setPlaceAddress] = useState(
    initialData?.placeAddress || "",
  );
  const [isSpecificPlace, setIsSpecificPlace] = useState(
    initialData?.isSpecificPlace || false,
  );
  const [selectedGoogleTagGroupIds, setSelectedGoogleTagGroupIds] = useState<
    string[]
  >(initialData?.googleTagGroupIds || []);
  const [principalGroups, setPrincipalGroups] = useState<PrincipalGroup[]>([]);
  const [isRecurring, setIsRecurring] = useState(
    initialData?.recurring || false,
  );
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [recurringRate, setRecurringRate] = useState(
    initialData?.recurringRate || "",
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (city || !user?.id) return;
    fetch(`/api/company?userId=${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.companyAddress) setCity(data.companyAddress);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/google-tags");
        if (!response.ok) return;
        const data = await response.json();
        setPrincipalGroups(Array.isArray(data?.groups) ? data.groups : []);
      } catch (error) {
        console.error("Erreur chargement thèmes:", error);
      }
    };
    fetchTags();
  }, []);

  const toggleGoogleTagGroup = (id: string) => {
    setSelectedGoogleTagGroupIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
    setErrors((prev) => ({ ...prev, googleTagGroupIds: "" }));
  };

  const scrollToField = (fieldId: string) => {
    document
      .getElementById(fieldId)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeOptions.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      );
    }
  }

  const validateDatesAndTimes = (): {
    valid: boolean;
    errors: { [key: string]: string };
  } => {
    const newErrors: { [key: string]: string } = {};
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    if (startDate && startDate < today) {
      newErrors.startDate =
        "La date de début ne peut pas être antérieure à aujourd'hui";
    }
    if (
      startDate &&
      startDate === today &&
      startTime &&
      startTime < currentTime
    ) {
      newErrors.startTime =
        "L'heure de début ne peut pas être antérieure à l'heure actuelle";
    }
    if (!isRecurring && endDate && startDate && endDate < startDate) {
      newErrors.endDate =
        "La date de fin ne peut pas être antérieure à la date de début";
    }
    if (
      !isRecurring &&
      startDate === endDate &&
      startTime &&
      endTime &&
      endTime <= startTime
    ) {
      newErrors.endTime =
        "L'heure de fin doit être postérieure à l'heure de début";
    }
    if (isRecurring && (!duration || parseInt(duration, 10) <= 0)) {
      newErrors.duration = "La durée doit être supérieure à 0";
    }
    if (isRecurring && !recurringRate) {
      newErrors.recurringRate = "Veuillez sélectionner une récurrence";
    }
    if (!isSpecificPlace && selectedGoogleTagGroupIds.length === 0) {
      newErrors.googleTagGroupIds =
        "Sélectionnez au moins un groupe d'activité";
    }

    setErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const fieldIdsByErrorKey: Record<string, string> = {
    googleTagGroupIds: "googleTagGroupIds",
    startDate: "startDate",
    startTime: "startTime",
    endDate: "endDate",
    endTime: "endTime",
    duration: "duration",
    recurringRate: "recurringRate",
  };

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setErrors((prev) => ({ ...prev, startDate: "" }));
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setErrors((prev) => ({ ...prev, endDate: "" }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!eventTitle.trim()) {
      alert("Le nom de l'événement est obligatoire");
      scrollToField("eventTitle");
      return;
    }

    if (!startDate) {
      alert("La date de début est obligatoire");
      scrollToField("startDate");
      return;
    }

    if (!startTime) {
      alert("L'heure de début est obligatoire");
      scrollToField("startTime");
      return;
    }

    if (!endTime) {
      alert("L'heure de fin est obligatoire");
      scrollToField("endTime");
      return;
    }

    if (isRecurring) {
      if (!duration || parseInt(duration, 10) <= 0) {
        alert("La durée doit être supérieure à 0");
        scrollToField("duration");
        return;
      }
      if (!recurringRate) {
        alert("Veuillez sélectionner une récurrence");
        scrollToField("recurringRate");
        return;
      }
    }

    if (isSpecificPlace) {
      if (!placeName || !placeAddress) {
        alert("Le nom et l'adresse du lieu sont obligatoires");
        scrollToField(!placeName ? "placeName" : "placeAddress");
        return;
      }
    } else if (!city) {
      alert("La ville est obligatoire");
      scrollToField("city");
      return;
    }

    const validation = validateDatesAndTimes();
    if (!validation.valid) {
      const [errorKey, message] = Object.entries(validation.errors)[0];
      alert(message);
      scrollToField(fieldIdsByErrorKey[errorKey] ?? errorKey);
      return;
    }

    if (requireMaxPersons && (!maxPersons || parseInt(maxPersons, 10) <= 0)) {
      alert(
        "Le nombre maximum de participants est obligatoire pour un événement public",
      );
      scrollToField("maxPersons");
      return;
    }

    let calculatedEndDate = endDate;
    if (isRecurring && startDate && duration) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + parseInt(duration, 10) - 1);
      calculatedEndDate = start.toISOString().split("T")[0];
    }

    onSubmit({
      title: eventTitle,
      startDate,
      endDate: calculatedEndDate,
      startTime,
      endTime,
      maxPersons,
      costPerPerson,
      city: isSpecificPlace ? "" : city,
      maxDistance: isSpecificPlace ? "" : maxDistance,
      placeName: isSpecificPlace ? placeName : undefined,
      placeAddress: isSpecificPlace ? placeAddress : undefined,
      recurring: isRecurring,
      duration: duration || "",
      recurringRate: recurringRate || "",
      isSpecificPlace,
      googleTagGroupIds: isSpecificPlace ? [] : selectedGoogleTagGroupIds,
      googleTagIds: [],
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="w-full mx-auto">
      <h1 className="text-h1 mb-4 text-left md:w-2/3 w-full font-urbanist">
        {title}
      </h1>
      {subtitle && (
        <h2 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
          {subtitle}
        </h2>
      )}

      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSpecificPlace}
            onChange={(e) => setIsSpecificPlace(e.target.checked)}
            className="w-5 h-5 mr-2 border-2 border-[var(--color-grey-two)] rounded accent-[var(--color-secondary)]"
          />
          <span className="text-body-large font-poppins text-[var(--color-grey-three)]">
            Lieu spécifique
          </span>
        </label>
      </div>

      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => {
              setIsRecurring(e.target.checked);
              if (!e.target.checked) {
                setDuration("");
                setRecurringRate("");
                setEndDate("");
              }
            }}
            className="w-5 h-5 mr-2 border-2 border-[var(--color-grey-two)] rounded accent-[var(--color-secondary)]"
          />
          <span className="text-body-large font-poppins text-[var(--color-grey-three)]">
            Événement récurrent
          </span>
        </label>
      </div>

      <div className="mb-4">
        <label
          htmlFor="eventTitle"
          className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
        >
          Nom de l&apos;événement
        </label>
        <input
          id="eventTitle"
          type="text"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          placeholder="Nom de l'événement"
          required
          className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label
            htmlFor="startDate"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Date de début
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            min={new Date().toISOString().split("T")[0]}
            required
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
          />
        </div>
        {!isRecurring ? (
          <div className="flex-1">
            <label
              htmlFor="endDate"
              className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
            >
              Date de fin
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || new Date().toISOString().split("T")[0]}
              className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
            />
          </div>
        ) : (
          <div className="flex-1">
            <label
              htmlFor="duration"
              className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
            >
              Durée (en jours)
            </label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              required
              className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
            />
          </div>
        )}
      </div>

      {isRecurring && (
        <div className="mb-4">
          <label
            htmlFor="recurringRate"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Récurrence
          </label>
          <select
            id="recurringRate"
            value={recurringRate}
            onChange={(e) => setRecurringRate(e.target.value)}
            required
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
          >
            <option value="">Sélectionner une récurrence</option>
            <option value="day">Par jour</option>
            <option value="week">Par semaine</option>
            <option value="month">Par mois</option>
            <option value="year">Par an</option>
          </select>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label
            htmlFor="startTime"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Heure de début
          </label>
          <select
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
          >
            <option value="">Sélectionner une heure</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="endTime"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Heure de fin
          </label>
          <select
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
          >
            <option value="">Sélectionner une heure</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label
            htmlFor="maxPersons"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Places maximum{requireMaxPersons ? " *" : ""}
          </label>
          <input
            id="maxPersons"
            type="number"
            value={maxPersons}
            onChange={(e) => setMaxPersons(e.target.value)}
            min="1"
            required={requireMaxPersons}
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="costPerPerson"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Coût par personne (€)
          </label>
          <input
            id="costPerPerson"
            type="number"
            value={costPerPerson}
            onChange={(e) => setCostPerPerson(e.target.value)}
            min="0"
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
          />
        </div>
      </div>

      {isSpecificPlace ? (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label
              htmlFor="placeName"
              className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
            >
              Nom du lieu
            </label>
            <input
              id="placeName"
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              required
              className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="placeAddress"
              className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
            >
              Adresse du lieu
            </label>
            <SimpleAutocomplete
              value={placeAddress}
              onChange={setPlaceAddress}
              placeholder="Adresse du lieu"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div id="city" className="flex-1">
            <label
              htmlFor="city"
              className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
            >
              Ville
            </label>
            <SimpleAutocomplete
              value={city}
              onChange={setCity}
              placeholder="Ville"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="maxDistance"
              className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
            >
              Distance max (km)
            </label>
            <input
              id="maxDistance"
              type="number"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              min="0"
              step="0.1"
              className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded"
            />
          </div>
        </div>
      )}

      {!isSpecificPlace && (
        <div id="googleTagGroupIds" className="mb-6">
          <label className="block mb-2 text-body-large font-poppins text-[var(--color-grey-three)]">
            Groupes d&apos;activité *
          </label>
          <PrincipalGroupPicker
            groups={principalGroups}
            selectedIds={selectedGoogleTagGroupIds}
            onToggle={toggleGoogleTagGroup}
          />
          {errors.googleTagGroupIds && (
            <p className="text-red-500 text-sm mt-1 font-poppins">
              {errors.googleTagGroupIds}
            </p>
          )}
        </div>
      )}

      <div className="md:w-1/5 w-full mb-8">
        <MainButton
          color="bg-[var(--color-text)] font-poppins text-body-large"
          text={isSubmitting ? "Création..." : buttonText}
          type="submit"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};

export default EventForm;
