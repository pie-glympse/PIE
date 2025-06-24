"use client"
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainButton from '@/components/ui/MainButton';

interface RegisterFormProps {
    title: string;
    buttonText: string;
    onSubmit?: (email: string, password: string) => void;
    onForgotPassword?: () => void;
    forgotPasswordText?: string;
    placeholderText?: string;
    placeholderTextPswrd?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
    title,
    buttonText,
    onSubmit,
    onForgotPassword,
    forgotPasswordText = 'Mot de passe oublié?',
    placeholderText,
    placeholderTextPswrd
}) => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstname, setFirstname] = useState('');
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        try {
            const formData = {
                email,
                password,
                name: `${firstname} ${name}`.trim(),
                firstname,
                lastname: name,
                companyName,
                address,
                postalCode
            };

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // ✅ Redirection automatique vers /events
                router.push('/events');
            } else {
                const error = await response.json();
                alert(error?.error || 'Erreur lors de l\'inscription');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau ou serveur');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-8 text-left md:w-2/3 w-full font-urbanist">{title}</h1>
            
            {/* Prénom et Nom */}
            <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="firstname" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Prénom</label>
                    <input
                        id="firstname"
                        type="text"
                        value={firstname}
                        onChange={e => setFirstname(e.target.value)}
                        placeholder="Prénom"
                        required
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="name" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nom"
                        required
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Nom de la société */}
            <div className="mb-4">
                <label htmlFor="companyName" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom de la société</label>
                <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Nom de la société"
                    className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Adresse et Code postal */}
            <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="address" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Adresse</label>
                    <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Adresse"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="postalCode" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Code postal</label>
                    <input
                        id="postalCode"
                        type="text"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        placeholder="Code postal"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="mb-4">
                <label htmlFor="email" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Adresse e-mail</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={placeholderText}
                    className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Mot de passe */}
            <div className="mb-2">
                <label htmlFor="password" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Mot de passe</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={placeholderTextPswrd}
                    required
                    className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF] mb-6"
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

export default RegisterForm;