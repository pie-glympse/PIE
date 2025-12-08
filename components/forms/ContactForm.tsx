"use client"
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainButton from '@/components/ui/MainButton';

interface ContactFormProps {
    title: React.ReactNode;
    buttonText: string;
    onSubmit?: (formData: {
        objet: string;
        email: string;
        date: string;
        message: string;
    }) => void;
    placeholderEmail?: string;
    placeholderObjet?: string;
    placeholderMessage?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({
    title,
    buttonText,
    onSubmit,
    placeholderEmail = "votre@email.com",
    placeholderObjet = "Objet de votre message",
    placeholderMessage = "Votre message..."
}) => {
    const router = useRouter();
    const [objet, setObjet] = useState('');
    const [email, setEmail] = useState('');
    const [date, setDate] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        try {
            const formData = {
                objet,
                email,
                date,
                message
            };

            if (onSubmit) {
                onSubmit(formData);
            } else {
                // API call par défaut
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Message envoyé avec succès!');
                    // Reset form
                    setObjet('');
                    setEmail('');
                    setDate('');
                    setMessage('');
                } else {
                    const error = await response.json();
                    alert(error?.error || 'Erreur lors de l\'envoi du message');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau ou serveur');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-8 text-left md:w-2/3 w-full font-urbanist">{title}</h1>
            
            {/* Objet */}
            <div className="mb-4">
                <label htmlFor="objet" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Objet</label>
                <input
                    id="objet"
                    type="text"
                    value={objet}
                    onChange={e => setObjet(e.target.value)}
                    placeholder={placeholderObjet}
                    required
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Email (75%) et Date (25%) sur la même ligne */}
            <div className="flex flex-row gap-4 mb-4">
                <div className="w-3/4">
                    <label htmlFor="email" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Adresse e-mail</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder={placeholderEmail}
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="w-1/4">
                    <label htmlFor="date" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Date</label>
                    <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Message - Grande textarea */}
            <div className="mb-6">
                <label htmlFor="message" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Message</label>
                <textarea
                    id="message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={placeholderMessage}
                    required
                    rows={8}
                    className="w-full px-5 py-3 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF] resize-vertical min-h-[200px]"
                />
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

export default ContactForm;