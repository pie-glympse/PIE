"use client" // src/app/register/page.tsx
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import RegisterForm from '@/components/forms/RegisterForm';
import BackArrow from '@/components/ui/BackArrow';

export default function RegisterPage() {
    const router = useRouter();
    const { user, isLoading } = useUser();

    // Rediriger vers /home si l'utilisateur est déjà connecté
    useEffect(() => {
        if (!isLoading && user) {
            router.push('/home');
        }
    }, [user, isLoading, router]);

    // Afficher un loader pendant la vérification
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    // Ne rien afficher si l'utilisateur est connecté (pendant la redirection)
    if (user) {
        return null;
    }

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full flex flex-col items-start gap-6 p-10">
                <div>
                    <BackArrow onClick={() => router.back()} className="" />
                </div>
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