"use client"
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainButton from '@/components/ui/MainButton';

interface EventFormProps {
    title: React.ReactNode;
    subtitle?: string;
    buttonText: string;
    onSubmit?: (formData: {
        title: string;
        startDate: string;
        endDate: string;
        startTime: string;
        endTime: string;
        maxPersons: number | null;
        costPerPerson: number | null;
        activityType: string;
        city: string;
        maxDistance: number | null;
        tags: number[];
    }) => void;
}

const EventForm: React.FC<EventFormProps> = ({
    title,
    subtitle,
    buttonText,
    onSubmit
}) => {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [maxPersons, setMaxPersons] = useState('');
    const [costPerPerson, setCostPerPerson] = useState('');
    const [activityType, setActivityType] = useState('');
    const [city, setCity] = useState('');
    const [maxDistance, setMaxDistance] = useState('');
    const [tags, setTags] = useState<number[]>([]);

    // Options pour les heures
    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeOptions.push(timeString);
        }
    }

    const handleTagToggle = (tagId: number) => {
        setTags((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        try {
            const formData = {
                title,
                startDate,
                endDate,
                startTime,
                endTime,
                maxPersons: maxPersons ? Number(maxPersons) : null,
                costPerPerson: costPerPerson ? Number(costPerPerson) : null,
                activityType,
                city,
                maxDistance: maxDistance ? parseFloat(maxDistance) : null,
                tags,
            };

            if (onSubmit) {
                onSubmit(formData);
            } else {
                // API call par défaut
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Événement créé avec succès!');
                    router.push('/events');
                } else {
                    const error = await response.json();
                    alert(error?.error || 'Erreur lors de la création de l\'événement');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau ou serveur');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-4 text-left md:w-2/3 w-full font-urbanist">{title}</h1>
            
            {subtitle && (
                <h2 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">{subtitle}</h2>
            )}
            
            {/* Titre de l'événement */}
            <div className="mb-4">
                <label htmlFor="title" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Titre de l&apos;événement</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre de l'événement"
                    required
                    className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Date de début, Date de fin, Heure de début et Heure de fin (25-25-25-25) */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="startDate" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Date de début</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        required
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="endDate" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Date de fin</label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="startTime" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Heure de début</label>
                    <div className="relative">
                        <select
                            id="startTime"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            required
                            className="w-full px-5 py-2 pr-12 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins text-[var(--color-text)] appearance-none bg-white cursor-pointer"
                        >
                            <option value="">Sélectionner une heure</option>
                            {timeOptions.map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-[var(--color-grey-three)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <label htmlFor="endTime" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Heure de fin</label>
                    <div className="relative">
                        <select
                            id="endTime"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            required
                            className="w-full px-5 py-2 pr-12 text-base border-2 border-[var(--color-grey-two)] rounded font-poppins text-[var(--color-text)] appearance-none bg-white cursor-pointer"
                        >
                            <option value="">Sélectionner une heure</option>
                            {timeOptions.map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-[var(--color-grey-three)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nombre max de personnes, Coût par personne, Type d'activité, Ville et Distance max (20-20-20-20-20) */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <label htmlFor="maxPersons" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nombre max de personnes</label>
                    <input
                        id="maxPersons"
                        type="number"
                        value={maxPersons}
                        onChange={e => setMaxPersons(e.target.value)}
                        min={1}
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="costPerPerson" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Coût par personne</label>
                    <input
                        id="costPerPerson"
                        type="number"
                        value={costPerPerson}
                        onChange={e => setCostPerPerson(e.target.value)}
                        min={0}
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="activityType" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Type d'activité</label>
                    <input
                        id="activityType"
                        type="text"
                        value={activityType}
                        onChange={e => setActivityType(e.target.value)}
                        placeholder="Type d'activité"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="city" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Ville</label>
                    <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        required
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="maxDistance" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Distance max</label>
                    <input
                        id="maxDistance"
                        type="number"
                        value={maxDistance}
                        onChange={e => setMaxDistance(e.target.value)}
                        min={0}
                        required
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Tags */}
            <fieldset className="mb-6">
                <legend className="block mb-2 text-body-large font-poppins text-[var(--color-grey-three)]">Catégories</legend>
                {[{ id: 1, name: "Restauration" }, { id: 2, name: "Afterwork" }, { id: 3, name: "Team Building" }, { id: 4, name: "Séminaire" }, { id: 5, name: "Autre" }].map((tag) => (
                    <label key={tag.id} className="block mb-1">
                        <input
                            type="checkbox"
                            checked={tags.includes(tag.id)}
                            onChange={() => handleTagToggle(tag.id)}
                            className="mr-2 leading-tight"
                        />{" "}
                        <span className="text-body-large font-poppins text-[var(--color-grey-three)]">{tag.name}</span>
                    </label>
                ))}
            </fieldset>

            <div className='md:w-1/5 w-full mb-8'>
                {/* Submit button */}
                <MainButton 
                    color="bg-[var(--color-text)] font-poppins text-body-large" 
                    text={buttonText} 
                    type="submit"
                />
            </div>
        </form>
    );
};

export default EventForm;