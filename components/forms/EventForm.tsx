"use client"
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainButton from '@/components/ui/MainButton';
import dynamic from 'next/dynamic';

// Déplacer le dynamic import EN DEHORS du composant pour éviter les re-renders
const AutocompleteInput = dynamic(() => import('@/components/ui/SimpleAutocomplete'), {
  ssr: false
});


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
        maxPersons: string;
        costPerPerson: string;
        city: string;
        maxDistance: string;
    }) => void;
}

const EventForm: React.FC<EventFormProps> = ({
    title,
    subtitle,
    buttonText,
    onSubmit
}) => {
    const router = useRouter();
    const [eventTitle, setEventTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [maxPersons, setMaxPersons] = useState('');
    const [costPerPerson, setCostPerPerson] = useState('');
    const [city, setCity] = useState('');
    const [maxDistance, setMaxDistance] = useState('');

    // Options pour les heures
    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeOptions.push(timeString);
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        try {
            const formData = {
                title: eventTitle,
                startDate,
                endDate,
                startTime,
                endTime,
                maxPersons,
                costPerPerson,
                city,
                maxDistance
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
            
            {/* Nom de l'événement */}
            <div className="mb-4">
                <label htmlFor="eventTitle" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom de l&apos;événement</label>
                <input
                    id="eventTitle"
                    type="text"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="Nom de l'événement"
                    required
                    className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Dates de début et fin (50-50) */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="startDate" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Date de début</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
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
            </div>

            {/* Heure de début et Heure de fin (50-50) */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
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

            {/* Places max et Budget par personne (50-50) */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="maxPersons" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Places maximum</label>
                    <input
                        id="maxPersons"
                        type="number"
                        value={maxPersons}
                        onChange={e => setMaxPersons(e.target.value)}
                        placeholder="Nombre de places"
                        min="1"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="costPerPerson" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Coût par personne (€)</label>
                    <input
                        id="costPerPerson"
                        type="number"
                        value={costPerPerson}
                        onChange={e => setCostPerPerson(e.target.value)}
                        placeholder="Ex: 50"
                        min="0"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Ville et Distance max (50-50) */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <label htmlFor="city" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Ville</label>
                    {/* <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Ville"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    /> */}
                    <AutocompleteInput value={city} onChange={setCity} placeholder="Ville ou adresse" />

                </div>
                <div className="flex-1">
                    <label htmlFor="maxDistance" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Distance max (km)</label>
                    <input
                        id="maxDistance"
                        type="number"
                        value={maxDistance}
                        onChange={e => setMaxDistance(e.target.value)}
                        placeholder="Ex: 50"
                        min="0"
                        step="0.1"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

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