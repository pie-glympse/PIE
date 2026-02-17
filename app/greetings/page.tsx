"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import MainButton from '@/components/ui/MainButton';
import Link from 'next/link';
import Image from 'next/image';

export default function GreetingsPage() {
    const router = useRouter();
    const { user, isLoading } = useUser();

    // Rediriger vers /home si l'utilisateur est déjà connecté
    useEffect(() => {
        if (!isLoading && user) {
            router.push('/home');
        }
    }, [user, isLoading, router]);

    // Désactiver le scroll uniquement sur cette page
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleRegisterTeam = () => {
        router.push('/register');
    };

    // Afficher un loader pendant la vérification
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    // Ne rien afficher si l'utilisateur est connecté (pendant la redirection)
    if (user) {
        return null;
    }

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10 overflow-hidden">
            <div className="h-full w-full md:w-1/2 flex flex-col gap-6 justify-between items-start p-10">
                <Link href="/login" aria-label="Retour à l'accueil">
                    <Image
                        src="/images/logo/Logotype.svg"
                        alt="Logo Glymps"
                        width={150}
                        height={150}
                        sizes="(max-width: 768px) 120px, 150px"
                        priority
                    />
                </Link>
                
                <div className="w-full flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-h1 font-urbanist text-left">
                            Bienvenue sur Glyms
                        </h1>
                        <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
                            Créez votre espace entreprise et inscrivez votre équipe en quelques clics.
                            Organisez des événements, gérez les préférences de votre équipe et créez des moments mémorables ensemble.
                        </p>
                    </div>

                    <div className="md:w-1/3 w-full">
                        <MainButton 
                            color="bg-[var(--color-text)] font-poppins text-body-large" 
                            text="Inscrire mon équipe" 
                            onClick={handleRegisterTeam}
                        />
                    </div>
                </div>

                <div className='flex flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)] w-full'>
                    <span>Vous avez déjà un compte ?</span>
                    <span>
                        <u className='cursor-pointer' onClick={() => router.push('/login')}>Connectez-vous</u>
                    </span>
                </div>
            </div>
            
            <div className="bg-[#E9F1FE] hidden md:w-1/2 md:h-full md:flex relative rounded-4xl">
                <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 w-[90%] bg-white flex flex-row gap-10 items-center p-6 rounded-lg">
                    <div>
                        <Image
                            src="/images/Qrcode.svg"
                            alt="Logo Glyms"
                            width={100}
                            height={100}
                            sizes="100px"
                            loading="lazy"
                        />
                    </div>
                    <div>
                        <p className='text-h3 font-poppins'>Téléchargez l&#39;Application Mobile</p>
                        <span className='text-body-large font-poppins text-[var(--color-grey-three)]'>Scannez pour télécharger</span>
                    </div>
                </div>
            </div>
            <div className="hidden md:block md:w-[45%] absolute right-10 aspect-[738/1049]">
                <div className="relative w-full h-full">
                    <Image
                        src="/images/mascotte/login-light.png"
                        alt="Image de connexion"
                        fill
                        className="object-cover rounded-4xl"
                        sizes="(max-width: 768px) 0vw, 45vw"
                        loading="lazy"
                    />
                </div>
            </div>
        </section>
    );
}
