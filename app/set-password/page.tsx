"use client"
import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import MainButton from '../../components/ui/MainButton';
import Link from 'next/link';
import Image from 'next/image';
import BackArrow from '../../components/ui/BackArrow';

// Composant interne qui utilise useSearchParams
const SetPasswordForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isUserLoading } = useUser();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');

    // Rediriger vers /home si l'utilisateur est déjà connecté
    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/home');
        }
    }, [user, isUserLoading, router]);

    // Initialiser les paramètres de l'URL au chargement
    useEffect(() => {
        const tokenParam = searchParams.get('token');
        const emailParam = searchParams.get('email');
        if (tokenParam) {
            // Décoder le token si nécessaire (les caractères hex ne devraient pas être encodés, mais au cas où)
            const decodedToken = decodeURIComponent(tokenParam);
            setToken(decodedToken);
            console.log("Token récupéré depuis URL:", {
                length: decodedToken.length,
                preview: decodedToken.substring(0, 10) + "..."
            });
        }
        if (emailParam) setEmail(decodeURIComponent(emailParam));
    }, [searchParams]);

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
            setErrorMsg("Lien de création de mot de passe invalide ou expiré");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Normaliser le token et l'email avant l'envoi
            const normalizedToken = token.trim();
            const normalizedEmail = email.trim();
            
            console.log("Envoi de la requête avec:", {
                tokenLength: normalizedToken.length,
                tokenPreview: normalizedToken.substring(0, 10) + "...",
                email: normalizedEmail
            });
            
            // Réutiliser l'API reset-password car elle fait exactement la même chose
            const res = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    token: normalizedToken, 
                    email: normalizedEmail, 
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
                setErrorMsg(data.error || `Erreur lors de la création du mot de passe (${res.status})`);
                return;
            }
            
            setMessage("Mot de passe créé avec succès ! Redirection vers la connexion...");
            
            // Rediriger vers la page de connexion après 2 secondes
            setTimeout(() => {
                router.push('/login');
            }, 2000);
            
        } catch (err) {
            console.error("Erreur lors de la création du mot de passe:", err);
            setErrorMsg("Erreur de connexion au serveur");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Afficher un loader pendant la vérification
    if (isUserLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    // Ne rien afficher si l'utilisateur est connecté (pendant la redirection)
    if (user) {
        return null;
    }

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full md:w-1/2 flex flex-col gap-6 items-start p-10">
                <Link href="/login" aria-label="Retour à l'accueil">
                    <Image
                        src="/images/logo/Logotype.svg"
                        alt="Logo Glymps"
                        width={150}
                        height={150}
                        priority
                    />
                </Link>
                <BackArrow onClick={() => router.push('/login')} className="" />

                <div className="w-full flex justify-between">
                    <form onSubmit={handleSubmit} className="w-full mx-auto">
                        <h1 className="text-h1 mb-8 text-left font-urbanist w-2/3">
                            Créez votre mot de passe
                        </h1>
                        
                        {email && (
                            <div className="mb-4 text-body-large font-poppins text-[var(--color-grey-three)]">
                                Compte : <strong>{email}</strong>
                            </div>
                        )}
                        
                        <div className="mb-6">
                            <label htmlFor="password" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
                                Mot de passe
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
                            text={isSubmitting ? "Création en cours..." : "Créer mon mot de passe"} 
                            type='submit' 
                            disabled={isSubmitting}
                        />
                    </form>
                </div>
                
                <div className="flex-grow" />
                <div className='flex flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)] w-full'>
                    <span>Vous avez déjà un compte ?</span>
                    <span>
                        <u className='cursor-pointer' onClick={() => router.push('/login')}>Connectez-vous</u>
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
const SetPasswordPage = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)] mx-auto mb-4"></div>
                    <p className="text-[var(--color-grey-three)] font-poppins">Chargement...</p>
                </div>
            </div>
        }>
            <SetPasswordForm />
        </Suspense>
    );
};

export default SetPasswordPage;
