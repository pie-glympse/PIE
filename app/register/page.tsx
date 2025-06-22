"use client" // src/app/register/page.tsx
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/forms/RegisterForm';
import BackArrow from '@/components/ui/BackArrow';

export default function RegisterPage() {
    const router = useRouter();

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
                        placeholderText="ex : nomprenom@societe.com"
                        placeholderTextPswrd="ex : MonMotDePasse123"
                    />
                </div>
            </div>
        </section>
    );
}