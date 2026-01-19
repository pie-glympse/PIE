"use client" // src/app/register/page.tsx
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import TeamRegisterForm from '@/components/forms/TeamRegisterForm';
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

    const handleLoginClick = () => {
        router.push('/login');
    };

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full flex flex-col gap-6 justify-between items-start p-10">
                <div>
                    <BackArrow onClick={() => router.push('/greetings')} className="" />
                </div>
                <div className="w-full flex justify-center">
                    <TeamRegisterForm
                        title={
                            <>
                                Inscrivez votre équipe<br />
                                Créez votre espace Entreprise
                            </>
                        }
                        buttonText="Inscrire mon équipe"
                    />
                </div>
                
                <div className='flex flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)] w-full'>
                    <span>Vous avez déjà un compte ?</span>
                    <span>
                        <u className='cursor-pointer' onClick={handleLoginClick}>Connectez-vous</u>
                    </span>
                </div>
            </div>
        </section>
    );
}