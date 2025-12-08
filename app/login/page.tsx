"use client" // src/app/login/page.tsx
import { useRouter } from "next/navigation";
import LoginForm from '@/components/forms/LoginForm';
import Link from "next/link";
import Image from 'next/image';
import { useEffect } from 'react';

export default function LoginPage() {
    const router = useRouter();

    // Désactiver le scroll uniquement sur cette page
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleForgotPassword = () => {
        // Logique pour mot de passe oublié
        router.push('forgot-password'); 
    };

    const handleRegisterClick = () => {
        router.push('/register');
    };

    const handleFirstConnectionClick = () => {
        router.push('/first-connection'); // ou la route appropriée
    };

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10 overflow-hidden">
            <div className="h-full w-full md:w-1/2 flex flex-col gap-6 justify-between items-start p-10">
                {/* mettre le lien vers la landing page de promotion */}
                <Link href="/login" aria-label="Retour à l'accueil" >
                <Image
                    src="/images/logo/Logotype.svg"
                    alt="Logo Glymps"
                    width={150}
                    height={150}
                    priority
                />
                </Link>
                
                <div className="w-full flex justify-center">
                    <LoginForm
                        title={
                            <>
                                Ravie de vous revoir sur Glyms,<br />
                                Connectez-vous !
                            </>
                        }
                        buttonText="Se connecter"
                        onForgotPassword={handleForgotPassword}
                        placeholderText="ex : nomprenom@societe.com"
                        placeholderTextPswrd="Votre mot de passe"
                    />
                </div>
                
                <div className='flex flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)] w-full'>
                    <span>Vous n&#39;avez pas encore de compte ?</span>
                    <span>
                        <u className='cursor-pointer' onClick={handleRegisterClick}>Inscrivez-vous</u> ou <u className='cursor-pointer' onClick={handleFirstConnectionClick}>Première Connexion</u>
                    </span>
                </div>
            </div>
            
            <div className="bg-[#E9F1FE] hidden md:w-1/2 md:h-full md:flex relative rounded-4xl">
                
                {/* Card QR Code par-dessus l'image */}
                <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 w-[90%] bg-white flex flex-row gap-10 items-center p-6 rounded-lg z-10">
                    <div>
                        <Image
                            src="/images/Qrcode.svg"
                            alt="Logo Glyms"
                            width={100}
                            height={100}
                            className=""
                        />
                    </div>
                    <div>
                        <p className='text-h3 font-poppins'>Téléchargez l&#39;Application Mobile</p>
                        <span className='text-body-large font-poppins text-[var(--color-grey-three)]'>Scannez pour télécharger</span>
                    </div>
                </div>
            </div>
            <div className="hidden md:block md:w-[45%]  absolute right-10 aspect-[738/1049]">
                <Image
                    src="/images/mascotte/login-light.png"
                    alt="Image de connexion"
                    fill
                    className="object-cover rounded-4xl"
                />
            </div>
        </section>
    );
}