"use client";

import { useState, FormEvent, useEffect } from "react";
import type { FC, ReactNode } from "react";
import MainButton from "@/components/ui/MainButton";
import SimpleAutocomplete from "@/components/ui/SimpleAutocomplete";
import { PrincipalGroupPicker } from "@/components/event/ThemeGroupPicker";
import { FormField, formInputClass } from "@/components/ui/form/FormField";
import { FormSection } from "@/components/ui/form/FormSection";
import { FormToggle } from "@/components/ui/form/FormToggle";
import { DateQuickPicker } from "@/components/ui/form/DateQuickPicker";
import { TimeRangePicker } from "@/components/ui/form/TimeRangePicker";

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
  const today = new Date().toISOString().split("T")[0];

  const [eventTitle, setEventTitle] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [multiDay, setMultiDay] = useState(
    Boolean(
      initialData?.endDate &&
        initialData?.startDate &&
        initialData.endDate !== initialData.startDate,
    ),
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || "18:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "20:00");
  const [maxPersons, setMaxPersons] = useState(initialData?.maxPersons || "");
  const [costPerPerson, setCostPerPerson] = useState(
    initialData?.costPerPerson || "",
  );
  const [city, setCity] = useState(initialData?.city || "");
  const [maxDistance, setMaxDistance] = useState(
    initialData?.maxDistance || "5",
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
    fetch("/api/google-tags")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setPrincipalGroups(Array.isArray(data?.groups) ? data.groups : []);
      })
      .catch(() => {});
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

  const validateDatesAndTimes = (): {
    valid: boolean;
    errors: { [key: string]: string };
  } => {
    const newErrors: { [key: string]: string } = {};
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
    if (
      !isRecurring &&
      multiDay &&
      endDate &&
      startDate &&
      endDate < startDate
    ) {
      newErrors.endDate =
        "La date de fin ne peut pas être antérieure à la date de début";
    }
    if (
      !isRecurring &&
      (multiDay ? startDate === endDate : true) &&
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!eventTitle.trim()) {
      alert("Le nom de l'événement est obligatoire");
      scrollToField("eventTitle");
      return;
    }
    if (!startDate) {
      alert("La date est obligatoire");
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

    const resolvedEndDate = isRecurring
      ? (() => {
          const start = new Date(startDate);
          start.setDate(start.getDate() + parseInt(duration, 10) - 1);
          return start.toISOString().split("T")[0];
        })()
      : multiDay
        ? endDate || startDate
        : startDate;

    onSubmit({
      title: eventTitle,
      startDate,
      endDate: resolvedEndDate,
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
    <form
      noValidate
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto"
    >
      <h1 className="text-h1 mb-3 text-left font-urbanist">{title}</h1>
      {subtitle && (
        <p className="text-body-small mb-6 font-poppins text-[var(--color-grey-three)]">
          {subtitle}
        </p>
      )}

      <FormSection
        step={1}
        variant="main"
        title="L'essentiel"
        description="Nom, date et horaires de votre événement"
      >
        <FormField id="eventTitle" label="Nom de l'événement" required>
          <input
            id="eventTitle"
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Ex : Afterwork d'équipe"
            className={formInputClass}
          />
        </FormField>

        {!isRecurring ? (
          <div id="startDate">
            <DateQuickPicker
              label="Date de l'événement"
              value={startDate}
              onChange={setStartDate}
              min={today}
              error={errors.startDate}
              multiDay={multiDay}
              onMultiDayChange={(next) => {
                setMultiDay(next);
                if (!next) setEndDate(startDate);
              }}
              endValue={endDate}
              onEndChange={setEndDate}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="startDate" label="Date de début" required>
              <input
                id="startDate"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className={formInputClass}
              />
            </FormField>
            <FormField
              id="duration"
              label="Durée (jours)"
              required
              error={errors.duration}
            >
              <input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={formInputClass}
              />
            </FormField>
          </div>
        )}

        <div id="startTime">
          <TimeRangePicker
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
            startError={errors.startTime}
            endError={errors.endTime}
          />
        </div>

        {!isSpecificPlace && (
          <div id="googleTagGroupIds">
            <p className="text-body-small font-poppins font-medium text-[var(--color-text)] mb-2">
              Groupes d&apos;activité *
            </p>
            <PrincipalGroupPicker
              groups={principalGroups}
              selectedIds={selectedGoogleTagGroupIds}
              onToggle={toggleGoogleTagGroup}
            />
            {errors.googleTagGroupIds ? (
              <p className="mt-1.5 text-body-small font-poppins text-[var(--color-secondary)]">
                {errors.googleTagGroupIds}
              </p>
            ) : null}
          </div>
        )}
      </FormSection>

      <FormSection
        step={2}
        variant="sky"
        title="Lieu"
        description={
          isSpecificPlace
            ? "Indiquez un lieu précis"
            : "Zone de recherche des activités"
        }
      >
        <FormToggle
          id="specificPlace"
          label="Lieu spécifique"
          description="Adresse exacte au lieu d'une ville + rayon"
          checked={isSpecificPlace}
          onChange={setIsSpecificPlace}
        />

        {isSpecificPlace ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="placeName" label="Nom du lieu" required>
              <input
                id="placeName"
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className={formInputClass}
              />
            </FormField>
            <FormField id="placeAddress" label="Adresse" required>
              <SimpleAutocomplete
                value={placeAddress}
                onChange={setPlaceAddress}
                placeholder="Adresse du lieu"
              />
            </FormField>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div id="city" className="md:col-span-2">
              <FormField id="city-input" label="Ville" required>
                <SimpleAutocomplete
                  value={city}
                  onChange={setCity}
                  placeholder="Paris, France"
                />
              </FormField>
            </div>
            <FormField
              id="maxDistance"
              label="Rayon (km)"
              hint="Par défaut 5 km"
            >
              <input
                id="maxDistance"
                type="number"
                min="0"
                step="0.5"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className={formInputClass}
              />
            </FormField>
          </div>
        )}
      </FormSection>

      <FormSection
        step={3}
        variant="tertiary"
        title="Capacité & options"
        description="Paramètres facultatifs"
        collapsible
        defaultOpen={requireMaxPersons || isRecurring}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="maxPersons"
            label="Places maximum"
            required={requireMaxPersons}
          >
            <input
              id="maxPersons"
              type="number"
              min="1"
              value={maxPersons}
              onChange={(e) => setMaxPersons(e.target.value)}
              className={formInputClass}
            />
          </FormField>
          <FormField id="costPerPerson" label="Coût / personne (€)">
            <input
              id="costPerPerson"
              type="number"
              min="0"
              value={costPerPerson}
              onChange={(e) => setCostPerPerson(e.target.value)}
              className={formInputClass}
            />
          </FormField>
        </div>

        <FormToggle
          id="recurring"
          label="Événement récurrent"
          checked={isRecurring}
          onChange={(checked) => {
            setIsRecurring(checked);
            if (!checked) {
              setDuration("");
              setRecurringRate("");
              setEndDate("");
              setMultiDay(false);
            }
          }}
        />

        {isRecurring && (
          <FormField
            id="recurringRate"
            label="Fréquence"
            required
            error={errors.recurringRate}
          >
            <select
              id="recurringRate"
              value={recurringRate}
              onChange={(e) => setRecurringRate(e.target.value)}
              className={formInputClass}
            >
              <option value="">Choisir…</option>
              <option value="day">Chaque jour</option>
              <option value="week">Chaque semaine</option>
              <option value="month">Chaque mois</option>
              <option value="year">Chaque année</option>
            </select>
          </FormField>
        )}
      </FormSection>

      <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t border-[var(--color-grey-two)]">
        <MainButton
          color="bg-[var(--color-text)] font-poppins text-body-large w-full md:w-auto min-w-[200px]"
          text={isSubmitting ? "Création..." : buttonText}
          type="submit"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};

export default EventForm;
