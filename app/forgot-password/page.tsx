"use client"
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainButton from '../../components/ui/MainButton';
import Link from 'next/link';
import Image from 'next/image';
import BackArrow from '../../components/ui/BackArrow';

const ForgotPasswordPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setMessage('');
        setIsLoading(true);
        
        try {
            const res = await fetch("/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            
            const contentType = res.headers.get("content-type");
            
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Réponse non-JSON reçue:", text);
                setErrorMsg("Erreur serveur: réponse invalide");
                return;
            }
            
            const responseText = await res.text();
            if (!responseText.trim()) {
                console.error("Réponse vide reçue");
                setErrorMsg("Erreur serveur: réponse vide");
                return;
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Erreur de parsing JSON:", parseError);
                setErrorMsg("Erreur serveur: format de réponse invalide");
                return;
            }
            
            if (!res.ok) {
                setErrorMsg(data.error || `Erreur lors de l'envoi (${res.status})`);
                return;
            }
            
            setMessage("Un email de récupération a été envoyé à votre adresse.");
            
        } catch (err) {
            console.error("Erreur lors de l'envoi:", err);
            setErrorMsg("Erreur de connexion au serveur");
        } finally {
            setIsLoading(false);
        }
    };


    const handleRegisterClick = () => {
        router.push('/register');
    };

    const handleFirstConnectionClick = () => {
        router.push('/first-connection'); // ou la route appropriée
    };

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full md:w-1/2 flex flex-col gap-6 items-start p-10">
                <p className='text-left'>LOGO ICI</p>
                <BackArrow onClick={() => router.back()} className="" />

                <div className="w-full flex justify-between">
                    <form onSubmit={handleSubmit} className="w-full mx-auto">
                        <h1 className="text-h1 mb-8 text-left w-full font-urbanist">
                            Mot de passe oublié ?
                        </h1>
                        
                        <div className="mb-6">
                            <label htmlFor="email" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                                Adresse e-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="ex : nomprenom@societe.com"
                                className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
                            />
                        </div>
                        
                        {errorMsg && (
                            <div className="mb-4 text-red-600 text-body-small font-poppins">
                                {errorMsg}
                            </div>
                        )}
                        
                        {message && (
                            <div className="mb-4 text-green-600 text-body-small font-poppins">
                                {message}
                            </div>
                        )}

                        <MainButton 
                            color="bg-[var(--color-text)] font-poppins text-body-large" 
                            text={isLoading ? "Envoi en cours..." : "Envoyer le lien"} 
                            type='submit' 
                            disabled={isLoading}
                        />
                    </form>
                </div>
                
                <div className="flex-grow" />
                <div className='flex flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)] w-full'>
                    <span>Vous n&#39;avez pas encore de compte ?</span>
                    <span>
                        <u className='cursor-pointer' onClick={handleRegisterClick}>Inscrivez-vous</u> ou <u className='cursor-pointer' onClick={handleFirstConnectionClick}>Première Connexion</u>
                    </span>
                </div>
            </div>
            
            {/* Section droite identique au login */}
            <div className="bg-[#E9F1FE] hidden md:w-1/2 md:h-full md:flex relative rounded-4xl">
                <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 w-[90%] bg-white flex flex-row gap-10 items-center p-6 rounded-lg">
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
        </section>
    );
};

export default ForgotPasswordPage;