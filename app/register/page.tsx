"use client"
// src/app/register/page.tsx
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LoginForm from '@/components/forms/LoginForm'
import FirstLogForm from '@/components/forms/FirstLogForm';
import ForgottenPswrd from '@/components/forms/ForgottenPswrd';
import RegisterForm from '@/components/forms/RegisterForm';
import BackArrow from '@/components/ui/BackArrow';
import Image from 'next/image';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
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
                alert(error?.error || 'Erreur lors de l'inscription');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau ou serveur');
        }
    };

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full flex flex-col justify-between items-start p-10">
                <p className='text-left'>LOGO ICI</p>
                <BackArrow onClick={() => router.back()} className="mb-8" />
                <div className="w-full flex justify-center">
                    <RegisterForm
                        title={
                            <>
                                Bienvenue sur Glyms,<br />
                                Créez votre espace Entreprise
                            </>
                        }
                        buttonText="S'inscrire"
                        onSubmit={(email, password) => console.log('Registration submitted:', email, password)}
                        placeholderText="ex : nomprenom@societe.com"
                        placeholderTextPswrd="ex : MonMotDePasse123"
                    />
                </div>
            </div>
        </section>
    );
}
