import React, { useState, FormEvent } from 'react';
import MainButton from '../ui/MainButton';
import BackArrow from '../ui/BackArrow';

interface ForgottenPswrdProps {
    title: string;
    buttonText: string;
    onSubmit?: (email: string) => void;
    placeholderText?: string;
}

const ForgottenPswrd: React.FC<ForgottenPswrdProps> = ({
    title,
    buttonText,
    onSubmit,
    placeholderText
}) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(email);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto">
            <BackArrow onClick={() => window.location.href = '/'} className="mb-8" />
            <h1 className="text-h1 mb-8 text-left w-2/3 font-urbanist">{title}</h1>
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
            <MainButton color="bg-[var(--color-text)] font-poppins text-body-large" text={buttonText} />
        </form>
    );
};

export default ForgottenPswrd;
