import React, { useState, FormEvent } from 'react';
import MainButton from '../ui/MainButton';

interface FirstLogFormProps {
    title: string;
    buttonText: string;
    onSubmit?: (email: string, password: string) => void;
    onForgotPassword?: () => void;
    forgotPasswordText?: string;
    placeholderText?: string;
    placeholderTextPswrd?: string;
}

const FirstLogForm: React.FC<FirstLogFormProps> = ({
    title,
    buttonText,
    onSubmit,
    onForgotPassword,
    forgotPasswordText = 'Mot de passe oublié?',
    placeholderText,
    placeholderTextPswrd

}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(email, password);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <h1 className="text-h1 mb-8 text-left w-2/3 font-urbanist">{title}</h1>
            <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="firstname" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Prénom</label>
                    <input
                        id="firstname"
                        type="text"
                        placeholder="Prénom"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="name" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Nom</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Nom"
                        className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                    />
                </div>
            </div>
            <div className="mb-4">
                <label htmlFor="email" className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">Adresse e-mail</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={placeholderText}
                    className="w-full px-5 py-2  text-base border-2 border-[var(--color-grey-two)] rounded  placeholder:text-body-large placeholder:font-poppins placeholder:text-[#EAEAEF]"
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
                    className="w-full px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
                />
            </div>
            <span
                className="text-[var(--color-grey-three)] text-body-small cursor-pointer text-sm block mb-6 text-right underline focus:underline"
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
            <MainButton color="bg-[var(--color-text)] font-poppins text-body-large" text={buttonText} />
        </form>
    );
};

export default FirstLogForm;
