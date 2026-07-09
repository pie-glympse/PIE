"use client";

import { useState, useEffect, FormEvent } from "react";
import type { FC } from "react";
import { useUser } from "@/context/UserContext";
import MainButton from "@/components/ui/MainButton";
import SimpleAutocomplete, {
  type SelectedPlace,
} from "@/components/ui/SimpleAutocomplete";
import StepperInput from "@/components/ui/StepperInput";

export type EventDetailsData = {
  title: string;
  description: string;
  dateKnown: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxPersons: string;
  // Branche catégorie (activité décidée par vote)
  city: string;
  maxDistance: string;
  // Branche « je sais ce que je veux » (lieu précis)
  placeName?: string;
  placeAddress?: string;
  placeId?: string;
  placeLat?: number;
  placeLng?: number;
};

interface EventDetailsStepProps {
  /** "category" : ville + rayon, lieu décidé par vote — "specific" : lieu précis Google */
  mode: "category" | "specific";
  requireMaxPersons?: boolean;
  buttonText: string;
  isSubmitting?: boolean;
  initialData?: Partial<EventDetailsData>;
  onSubmit: (data: EventDetailsData) => void;
}

const inputClass =
  "w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]";
const labelClass =
  "block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]";

const timeOptions: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    timeOptions.push(
      `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    );
  }
}

const EventDetailsStep: FC<EventDetailsStepProps> = ({
  mode,
  requireMaxPersons = false,
  buttonText,
  isSubmitting = false,
  initialData,
  onSubmit,
}) => {
  const { user } = useUser();
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dateKnown, setDateKnown] = useState(initialData?.dateKnown ?? false);
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [maxPersons, setMaxPersons] = useState(initialData?.maxPersons || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [maxDistance, setMaxDistance] = useState(
    initialData?.maxDistance || "10",
  );
  const [placeName, setPlaceName] = useState(initialData?.placeName || "");
  const [placeAddress, setPlaceAddress] = useState(
    initialData?.placeAddress || "",
  );
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    initialData?.placeId
      ? {
          placeId: initialData.placeId,
          name: initialData.placeName,
          address: initialData.placeAddress,
          lat: initialData.placeLat,
          lng: initialData.placeLng,
        }
      : null,
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDateTooltip, setShowDateTooltip] = useState(false);

  // Pré-remplir la ville avec l'adresse de l'entreprise (comportement existant)
  useEffect(() => {
    if (mode !== "category" || city || !user?.id) return;
    fetch(`/api/company?userId=${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.companyAddress) setCity(data.companyAddress);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mode]);

  const clearError = (key: string) =>
    setErrors((prev) => ({ ...prev, [key]: "" }));

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    if (!title.trim()) newErrors.title = "Le nom de l'événement est obligatoire";

    if (!startDate) {
      newErrors.startDate = dateKnown
        ? "La date de début est obligatoire"
        : "Le début de la plage de dates est obligatoire";
    } else if (startDate < today) {
      newErrors.startDate =
        "La date de début ne peut pas être antérieure à aujourd'hui";
    }

    if (!dateKnown && !endDate) {
      newErrors.endDate = "La fin de la plage de dates est obligatoire";
    }
    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate =
        "La date de fin ne peut pas être antérieure à la date de début";
    }
    if (!dateKnown && startDate && endDate && endDate === startDate) {
      newErrors.endDate =
        "La plage doit couvrir au moins deux jours pour laisser le choix aux participants";
    }

    if (!startTime) newErrors.startTime = "L'heure de début est obligatoire";
    if (!endTime) newErrors.endTime = "L'heure de fin est obligatoire";
    if (
      startDate &&
      startDate === today &&
      startTime &&
      startTime < currentTime
    ) {
      newErrors.startTime =
        "L'heure de début ne peut pas être antérieure à l'heure actuelle";
    }
    if (
      startTime &&
      endTime &&
      endTime <= startTime &&
      (dateKnown ? (endDate || startDate) === startDate : true)
    ) {
      newErrors.endTime =
        "L'heure de fin doit être postérieure à l'heure de début";
    }

    if (
      requireMaxPersons &&
      (!maxPersons || parseInt(maxPersons, 10) <= 0)
    ) {
      newErrors.maxPersons =
        "Le nombre de places est obligatoire pour un événement public";
    }

    if (mode === "specific") {
      if (!placeName.trim()) newErrors.placeName = "Le nom du lieu est obligatoire";
      if (!placeAddress.trim())
        newErrors.placeAddress = "L'adresse complète du lieu est obligatoire";
    } else {
      if (!city.trim()) newErrors.city = "La ville est obligatoire";
      if (maxDistance !== "" && Number(maxDistance) <= 0) {
        newErrors.maxDistance = "La distance doit être supérieure à 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dateKnown,
      startDate,
      endDate: dateKnown ? endDate || startDate : endDate,
      startTime,
      endTime,
      maxPersons,
      city: mode === "category" ? city : "",
      maxDistance: mode === "category" ? maxDistance : "",
      placeName: mode === "specific" ? placeName : undefined,
      placeAddress: mode === "specific" ? placeAddress : undefined,
      placeId: mode === "specific" ? selectedPlace?.placeId : undefined,
      placeLat: mode === "specific" ? selectedPlace?.lat : undefined,
      placeLng: mode === "specific" ? selectedPlace?.lng : undefined,
    });
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-red-500 text-sm mt-1 font-poppins">{errors[key]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-3xl">
      <h1 className="text-h1 mb-4 text-left font-urbanist">
        Créez vos évènements personnalisés !
      </h1>
      <h2 className="text-h3 mb-8 text-left font-poppins text-[var(--color-grey-three)]">
        Entrez les informations générales de l&apos;évènement
      </h2>

      {/* Nom */}
      <div className="mb-6">
        <label htmlFor="eventTitle" className={labelClass}>
          Nom de l&apos;événement *
        </label>
        <input
          id="eventTitle"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError("title");
          }}
          placeholder="Ex : Escape Game Market édition"
          className={inputClass}
        />
        {fieldError("title")}
      </div>

      {/* Je connais la date */}
      <div className="mb-6">
        <div className="relative flex items-center gap-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dateKnown}
              onChange={(e) => {
                setDateKnown(e.target.checked);
                clearError("startDate");
                clearError("endDate");
              }}
              className="w-5 h-5 mr-2 border-2 border-[var(--color-grey-two)] rounded accent-[var(--color-secondary)]"
            />
            <span className="text-body-large font-poppins text-[var(--color-grey-three)]">
              Je connais déjà la date de l&apos;événement
            </span>
          </label>
          <button
            type="button"
            className="w-5 h-5 rounded-full border border-[var(--color-grey-three)] text-[var(--color-grey-three)] text-xs font-medium flex items-center justify-center hover:bg-[var(--color-grey-one)]"
            aria-label="Informations sur la plage de dates"
            onMouseEnter={() => setShowDateTooltip(true)}
            onMouseLeave={() => setShowDateTooltip(false)}
            onFocus={() => setShowDateTooltip(true)}
            onBlur={() => setShowDateTooltip(false)}
          >
            i
          </button>
          {showDateTooltip && (
            <div
              role="tooltip"
              className="absolute left-0 top-full mt-2 z-20 max-w-md p-4 bg-[#E9F1FE] border-2 border-[var(--color-grey-two)] rounded-lg shadow-lg text-body-small font-poppins text-[var(--color-text)]"
            >
              Les participants de votre évènement auront la possibilité de
              choisir une date parmi la plage que vous aurez sélectionnée.
            </div>
          )}
        </div>
      </div>

      {/* Dates : précises ou plage */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="startDate" className={labelClass}>
            {dateKnown ? "Date de début *" : "Plage de dates — Du *"}
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => {
              setStartDate(e.target.value);
              clearError("startDate");
            }}
            className={inputClass}
          />
          {fieldError("startDate")}
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className={labelClass}>
            {dateKnown ? "Date de fin" : "Au *"}
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => {
              setEndDate(e.target.value);
              clearError("endDate");
            }}
            className={inputClass}
          />
          {fieldError("endDate")}
        </div>
      </div>

      {/* Heures */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="startTime" className={labelClass}>
            Heure de début *
          </label>
          <select
            id="startTime"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              clearError("startTime");
            }}
            className={inputClass}
          >
            <option value="">ex : 20:00</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {fieldError("startTime")}
        </div>
        <div className="flex-1">
          <label htmlFor="endTime" className={labelClass}>
            Heure de fin *
          </label>
          <select
            id="endTime"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              clearError("endTime");
            }}
            className={inputClass}
          >
            <option value="">ex : 22:00</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {fieldError("endTime")}
        </div>
      </div>

      {/* Places maximum */}
      <div className="mb-6 md:w-1/2">
        <label htmlFor="maxPersons" className={labelClass}>
          Places maximum{requireMaxPersons ? " *" : ""}
        </label>
        <StepperInput
          id="maxPersons"
          value={maxPersons}
          onChange={(v) => {
            setMaxPersons(v);
            clearError("maxPersons");
          }}
          min={1}
          placeholder="32"
        />
        {fieldError("maxPersons")}
      </div>

      {/* Lieu : divergence selon la branche */}
      {mode === "specific" ? (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="placeName" className={labelClass}>
              Nom du lieu *
            </label>
            <SimpleAutocomplete
              value={placeName}
              onChange={(v) => {
                setPlaceName(v);
                clearError("placeName");
              }}
              placeholder="ex : Rosco"
              searchPlaces
              onPlaceSelected={(place) => {
                setSelectedPlace(place);
                if (place.name) setPlaceName(place.name);
                if (place.address) {
                  setPlaceAddress(place.address);
                  clearError("placeAddress");
                }
              }}
            />
            {fieldError("placeName")}
          </div>
          <div className="flex-1">
            <label htmlFor="placeAddress" className={labelClass}>
              Adresse complète du lieu *
            </label>
            <SimpleAutocomplete
              value={placeAddress}
              onChange={(v) => {
                setPlaceAddress(v);
                clearError("placeAddress");
              }}
              placeholder="ex : 13 Rue de la Liberté, 92000 Nanterre"
              onPlaceSelected={(place) => {
                setSelectedPlace((prev) => ({
                  ...place,
                  name: prev?.name ?? place.name,
                }));
              }}
            />
            {fieldError("placeAddress")}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="city" className={labelClass}>
              Ville *
            </label>
            <SimpleAutocomplete
              value={city}
              onChange={(v) => {
                setCity(v);
                clearError("city");
              }}
              placeholder="ex : Clichy"
            />
            {fieldError("city")}
          </div>
          <div className="flex-1">
            <label htmlFor="maxDistance" className={labelClass}>
              Distance maximum *
            </label>
            <StepperInput
              id="maxDistance"
              value={maxDistance}
              onChange={(v) => {
                setMaxDistance(v);
                clearError("maxDistance");
              }}
              min={1}
              suffix="km"
              placeholder="10"
            />
            {fieldError("maxDistance")}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Décrivez votre évènement…"
          className={`${inputClass} resize-none`}
        />
      </div>

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

export default EventDetailsStep;
