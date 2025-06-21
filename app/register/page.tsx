"use client"
// src/app/login/page.tsx
import LoginForm from '@/components/forms/LoginForm'
import FirstLogForm from '@/components/forms/FirstLogForm';
import ForgottenPswrd from '@/components/forms/ForgottenPswrd';
import RegisterForm from '@/components/forms/RegisterForm';
import BackArrow from '@/components/ui/BackArrow';
import Image from 'next/image';

export default function RegisterPage() {
    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full flex flex-col justify-between items-start p-10">
                <p className='text-left'>LOGO ICI</p>
                {/* <BackArrow onClick={() => window.location.href = '/'} className="mb-8" /> */}
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