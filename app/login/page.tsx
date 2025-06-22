"use client"
// src/app/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import LoginForm from '@/components/forms/LoginForm'
import FirstLogForm from '@/components/forms/FirstLogForm';
import ForgottenPswrd from '@/components/forms/ForgottenPswrd';
import BackArrow from '@/components/ui/BackArrow';
import Image from 'next/image';

export default function LoginPage() {
    const { setUser, setToken } = useUser();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Erreur de connexion");
                return;
            }

            setToken(data.token);
            setUser(data.user);

            // Optionnel mais utile pour persistance
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            router.push("/events"); // ou autre redirection post-login
        } catch (err) {
            console.error(err);
            setErrorMsg("Erreur serveur");
        }
    };

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-1/2 flex flex-col justify-between items-start p-10">
                <p className='text-left'>LOGO ICI</p>
                <BackArrow onClick={() => router.back()} className="mb-8" />
                
                <div className="w-full flex justify-center">
                    <ForgottenPswrd
                        title={`Vous avez oublié votre mot de passe ?`}
                        buttonText="Recevoir le lien"
                        placeholderText="ex : nomprenom @societe.com"
                        onSubmit={(email) => console.log('Forgotten password submitted:', email)}
                    />
                </div>
                      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

                
                <div className='flex flex-col items-center gap-2 text-center text-body-small font-poppins text-[var(--color-grey-three)] w-full'>
                    <span>Vous n&#39;avez pas encore de compte ?</span>
                    <span>
                        <u className='cursor-pointer'>Inscrivez-vous</u> ou <u className='cursor-pointer'>Première Connexion</u>
                    </span>
                </div>
            </div>
            <div className="bg-[#E9F1FE] w-1/2 h-full flex relative rounded-4xl">
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
                        <p className='text-h3 font-poppins'>Téléchargez l'Application Mobile</p>
                        <span className='text-body-large font-poppins text-[var(--color-grey-three)]'>Scannez pour télécharger</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
