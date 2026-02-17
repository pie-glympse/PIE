"use client"
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext'; // ✅ Ajouter l'import
import MainButton from '@/components/ui/MainButton';

interface RegisterFormProps {
    title: React.ReactNode;
    buttonText: string;
    onSubmit?: (email: string, password: string) => void;
    onForgotPassword?: () => void;
    forgotPasswordText?: string;
    placeholderText?: string;
    placeholderTextPswrd?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
    title,
    buttonText,
    onSubmit,
    onForgotPassword,
    forgotPasswordText = 'Mot de passe oublié?',
    placeholderText,
    placeholderTextPswrd
}) => {
    // ✅ Ajouter les hooks UserContext comme dans LoginForm
    const { setUser, setToken } = useUser();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    // ✅ Ajouter l'état d'erreur comme dans LoginForm
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(''); // ✅ Reset l'erreur
        
        try {
            const formData = {
                email,
                password,
                firstName,
                lastName,
                companyName,
                address,
                postalCode
            };

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            // ✅ Gérer la réponse comme dans LoginForm
            if (!response.ok) {
                const errorData = await response.json();
                setErrorMsg(errorData.error || 'Erreur lors de l\'inscription');
                return;
            }

            // ✅ Récupérer les données comme dans LoginForm
            const data = await response.json();
            
            // ✅ Vérifier que les données nécessaires sont présentes
            if (!data.token || !data.user) {
                console.error("Données manquantes dans la réponse:", data);
                setErrorMsg("Erreur serveur: données incomplètes");
                return;
            }
            
            // ✅ Initialiser le UserContext comme dans LoginForm
            setToken(data.token);
            setUser(data.user);
            
            // ✅ Persistance locale comme dans LoginForm
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            // ✅ Redirection vers /home
            router.push('/home');

        } catch (err) {
            console.error("Erreur lors de l'inscription:", err);
            setErrorMsg("Erreur de connexion au serveur");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-8 text-left md:w-2/3 w-full font-urbanist">{title}</h1>
            
            {/* Prénom et Nom */}
            <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="firstname" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Prénom</label>
                    <input
                        id="firstname"
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        required
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="lastname" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom</label>
                    <input
                        id="lastname"
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Nom"
                        required
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Nom de la société */}
            <div className="mb-4">
                <label htmlFor="companyName" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom de la société</label>
                <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Nom de la société"
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>

            {/* Adresse et Code postal */}
            <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="address" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Adresse</label>
                    <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Adresse"
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="postalCode" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Code postal</label>
                    <input
                        id="postalCode"
                        type="text"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        placeholder="Code postal"
                        className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>

            {/* Email */}
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

            {/* Mot de passe */}
            <div className="mb-2">
                <label htmlFor="password" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Mot de passe</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={placeholderTextPswrd}
                    required
                    className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF] mb-6"
                />
            </div>

            {/* ✅ Ajouter l'affichage d'erreur comme dans LoginForm */}
            {errorMsg && (
                <div className="mb-4 text-red-600 text-body-small font-poppins">
                    {errorMsg}
                </div>
            )}

            <div className='md:w-1/5 w-full mb-8'>
                {/* Submit button */}
                <MainButton 
                    color="bg-[var(--color-text)] font-poppins text-body-large" 
                    text={buttonText} 
                    type="submit"
                />
            </div>
        </form>
    );
};

export default RegisterForm;