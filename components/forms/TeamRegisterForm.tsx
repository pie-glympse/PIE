"use client"
import React, { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainButton from '@/components/ui/MainButton';

interface TeamRegisterFormProps {
    title: React.ReactNode;
    buttonText: string;
}

interface CSVRow {
    email: string;
    firstName: string;
    lastName: string;
}

const TeamRegisterForm: React.FC<TeamRegisterFormProps> = ({
    title,
    buttonText
}) => {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<CSVRow[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): CSVRow[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        // Détecter si la première ligne est un header
        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('email') && (firstLine.includes('prenom') || firstLine.includes('prénom') || firstLine.includes('firstname') || firstLine.includes('first name'));
        
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        return dataLines.map(line => {
            // Gérer les virgules et points-virgules comme séparateurs
            const parts = line.includes(';') ? line.split(';') : line.split(',');
            const trimmedParts = parts.map(p => p.trim().replace(/^"|"$/g, ''));
            
            // Format attendu: email, firstName, lastName
            return {
                email: trimmedParts[0] || '',
                firstName: trimmedParts[1] || '',
                lastName: trimmedParts[2] || ''
            };
        }).filter(row => row.email && row.email.includes('@')); // Filtrer les lignes invalides
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérifier que c'est un fichier CSV
        if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
            setErrorMsg('Veuillez sélectionner un fichier CSV');
            return;
        }

        setCsvFile(file);
        setErrorMsg('');
        setSuccessMsg('');

        // Lire et prévisualiser le fichier
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseCSV(text);
            setCsvPreview(parsed);
            
            if (parsed.length === 0) {
                setErrorMsg('Aucune donnée valide trouvée dans le CSV. Format attendu: email, prénom, nom');
            } else {
                setSuccessMsg(`${parsed.length} employé(s) trouvé(s) dans le fichier`);
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setIsSubmitting(true);

        if (!csvFile) {
            setErrorMsg('Veuillez télécharger un fichier CSV');
            setIsSubmitting(false);
            return;
        }

        if (csvPreview.length === 0) {
            setErrorMsg('Le fichier CSV ne contient pas de données valides');
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('email', email);
            formData.append('companyName', companyName);
            formData.append('csvFile', csvFile);

            const response = await fetch('/api/register-team', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || 'Erreur lors de l\'inscription de l\'équipe');
                setIsSubmitting(false);
                return;
            }

            setSuccessMsg(`Inscription réussie ! ${data.usersCreated} utilisateur(s) créé(s). Les emails de création de mot de passe ont été envoyés.`);
            
            // Rediriger après 3 secondes
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err) {
            console.error("Erreur lors de l'inscription:", err);
            setErrorMsg("Erreur de connexion au serveur");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-8 text-left md:w-2/3 w-full font-urbanist">{title}</h1>
            
            {/* Prénom et Nom du patron */}
            <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="firstname" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Votre prénom</label>
                    <input
                        id="firstname"
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        required
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="lastname" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Votre nom</label>
                    <input
                        id="lastname"
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Nom"
                        required
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Email du patron */}
            <div className="mb-4">
                <label htmlFor="email" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Votre adresse e-mail</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ex : nomprenom@societe.com"
                    required
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Nom de l'entreprise */}
            <div className="mb-4">
                <label htmlFor="companyName" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom de l'entreprise</label>
                <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Nom de l'entreprise"
                    required
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Upload CSV */}
            <div className="mb-4">
                <label htmlFor="csvFile" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                    Fichier CSV de votre équipe
                </label>
                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        required
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-poppins file:bg-[var(--color-text)] file:text-white hover:file:bg-[var(--color-text)]/90"
                    />
                    <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
                        Format attendu: email, prénom, nom (une ligne par employé)
                    </p>
                </div>
            </div>

            {/* Prévisualisation CSV */}
            {csvPreview.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded border border-[var(--color-grey-two)]">
                    <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-2">
                        <strong>{csvPreview.length}</strong> employé(s) trouvé(s):
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-body-small">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Email</th>
                                    <th className="text-left p-2">Prénom</th>
                                    <th className="text-left p-2">Nom</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvPreview.slice(0, 10).map((row, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2">{row.email}</td>
                                        <td className="p-2">{row.firstName}</td>
                                        <td className="p-2">{row.lastName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {csvPreview.length > 10 && (
                            <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                                ... et {csvPreview.length - 10} autre(s)
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Messages d'erreur et de succès */}
            {errorMsg && (
                <div className="mb-4 text-red-600 text-body-small font-poppins">
                    {errorMsg}
                </div>
            )}

            {successMsg && (
                <div className="mb-4 text-green-600 text-body-small font-poppins">
                    {successMsg}
                </div>
            )}

            <div className='md:w-1/5 w-full mb-8'>
                <MainButton 
                    color="bg-[var(--color-text)] font-poppins text-body-large" 
                    text={isSubmitting ? "Inscription en cours..." : buttonText} 
                    type="submit"
                    disabled={isSubmitting}
                />
            </div>
        </form>
    );
};

export default TeamRegisterForm;
