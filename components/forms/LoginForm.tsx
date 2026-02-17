"use client"
import { useState, FormEvent } from 'react';
import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import MainButton from '../ui/MainButton';

interface LoginFormProps {
    title: ReactNode;
    buttonText: string;
    onSubmit?: (email: string, password: string) => void;
    onForgotPassword?: () => void;
    forgotPasswordText?: string;
    placeholderText?: string;
    placeholderTextPswrd?: string;
}

const LoginForm: FC<LoginFormProps> = ({
    title,
    buttonText,
    onSubmit,
    onForgotPassword,
    forgotPasswordText = 'Mot de passe oublié ?',
    placeholderText,
    placeholderTextPswrd
}) => {
    const { setUser, setToken } = useUser();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            
            // Vérifier d'abord si la réponse contient du contenu
            const contentType = res.headers.get("content-type");
            
            if (!contentType || !contentType.includes("application/json")) {
                // Si ce n'est pas du JSON, obtenir le texte brut
                const text = await res.text();
                console.error("Réponse non-JSON reçue:", text);
                setErrorMsg("Erreur serveur: réponse invalide");
                return;
            }
            
            // Vérifier si la réponse a du contenu
            const responseText = await res.text();
            if (!responseText.trim()) {
                console.error("Réponse vide reçue");
                setErrorMsg("Erreur serveur: réponse vide");
                return;
            }
            
            // Parser le JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Erreur de parsing JSON:", parseError);
                console.error("Contenu de la réponse:", responseText);
                setErrorMsg("Erreur serveur: format de réponse invalide");
                return;
            }
            
            if (!res.ok) {
                setErrorMsg(data.error || `Erreur de connexion (${res.status})`);
                return;
            }
            
            // Vérifier que les données nécessaires sont présentes
            if (!data.token || !data.user) {
                console.error("Données manquantes dans la réponse:", data);
                setErrorMsg("Erreur serveur: données incomplètes");
                return;
            }
            
            setToken(data.token);
            setUser(data.user);
            
            // Persistance locale (optionnel - peut être géré dans le context)
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            router.push("/home");
            
        } catch (err) {
            console.error("Erreur lors de la connexion:", err);
            setErrorMsg("Erreur de connexion au serveur");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-8 text-left w-full font-urbanist">{title}</h1>
            
            <div className="mb-4">
                <label htmlFor="email" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Adresse e-mail</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={placeholderText}
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>
            
            <div className="mb-2">
                <label htmlFor="password" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Mot de passe</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={placeholderTextPswrd}
                    required
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>
            
            {errorMsg && (
                <div className="mb-4 text-red-600 text-body-small font-poppins">
                    {errorMsg}
                </div>
            )}
            
            <span
                className="text-[var(--color-grey-three)] text-body-small font-poppins cursor-pointer text-sm block mb-6 text-right underline focus:underline"
                onClick={onForgotPassword}
                tabIndex={0}
                role="button"
                onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if (onForgotPassword) {
                            onForgotPassword();
                        }
                    }
                }}
            >
                {forgotPasswordText}
            </span>

            <MainButton color="bg-[var(--color-text)] font-poppins text-body-large" text={buttonText} type='submit' />
        </form>
    );
};

export default LoginForm;