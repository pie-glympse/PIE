"use client"
import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainButton from '../../components/ui/MainButton';
import Link from 'next/link';
import Image from 'next/image';
import BackArrow from '../../components/ui/BackArrow';

// Composant interne qui utilise useSearchParams
const ResetPasswordForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');

    // Initialiser les paramètres de l'URL au chargement
    useEffect(() => {
        const tokenParam = searchParams.get('token');
        const emailParam = searchParams.get('email');
        if (tokenParam) setToken(tokenParam);
        if (emailParam) setEmail(decodeURIComponent(emailParam));
    }, [searchParams, setToken, setEmail]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setMessage('');

        // Validation des champs
        if (!password.trim()) {
            setErrorMsg("Le mot de passe est requis");
            return;
        }
        
        if (password.length < 8) {
            setErrorMsg("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }
        
        if (password !== confirmPassword) {
            setErrorMsg("Les mots de passe ne correspondent pas");
            return;
        }

        if (!token || !email) {
            setErrorMsg("Lien de récupération invalide ou expiré");
            return;
        }
        
        setIsLoading(true);
        
        try {
            const res = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    token, 
                    email, 
                    password 
                }),
            });
            
            const contentType = res.headers.get("content-type");
            
            if (!contentType?.includes("application/json")) {
                const text = await res.text();
                console.error("Réponse non-JSON reçue:", text);
                setErrorMsg("Erreur serveur: réponse invalide");
                return;
            }
            
            const data = await res.json();
            
            if (!res.ok) {
                setErrorMsg(data.error || `Erreur lors de la réinitialisation (${res.status})`);
                return;
            }
            
            setMessage("Mot de passe modifié avec succès ! Redirection...");
            
            // Rediriger vers la page de connexion après 2 secondes
            setTimeout(() => {
                router.push('/login');
            }, 2000);
            
        } catch (err) {
            console.error("Erreur lors de la réinitialisation:", err);
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
                <BackArrow onClick={() => router.back()} className="" />

                <div className="w-full flex justify-between">
                    <form onSubmit={handleSubmit} className="w-full mx-auto">
                        <h1 className="text-h1 mb-8 text-left font-urbanist w-2/3">
                            Renseigner votre nouveau mot de passe
                        </h1>
                        
                        {email && (
                            <div className="mb-4 text-body-large font-poppins text-[var(--color-grey-three)]">
                                Réinitialisation pour : <strong>{email}</strong>
                            </div>
                        )}
                        
                        <div className="mb-6">
                            <label htmlFor="password" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                                Nouveau mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Au moins 8 caractères"
                                className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Répétez votre mot de passe"
                                className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
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
                            text={isLoading ? "Envoi en cours..." : "Valider"} 
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

// Composant principal avec Suspense boundary
const ResetPasswordPage = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)] mx-auto mb-4"></div>
                    <p className="text-[var(--color-grey-three)] font-poppins">Chargement...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
};

export default ResetPasswordPage;