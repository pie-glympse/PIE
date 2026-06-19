"use client";
import { useState, FormEvent } from "react";
import type { FC, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import MainButton from "@/components/ui/MainButton";
import SimpleAutocomplete from "@/components/ui/SimpleAutocomplete";
import { FormField, formInputClass } from "@/components/ui/form/FormField";
import { FormSection } from "@/components/ui/form/FormSection";

interface RegisterFormProps {
  title: ReactNode;
  buttonText: string;
  placeholderText?: string;
  placeholderTextPswrd?: string;
}

const RegisterForm: FC<RegisterFormProps> = ({
  title,
  buttonText,
  placeholderText,
  placeholderTextPswrd,
}) => {
  const { setUser, setToken } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          companyName,
          address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.error || "Erreur lors de l'inscription");
        return;
      }

      const data = await response.json();
      if (!data.token || !data.user) {
        setErrorMsg("Erreur serveur: données incomplètes");
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/home");
    } catch {
      setErrorMsg("Erreur de connexion au serveur");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <h1 className="text-h1 mb-6 text-left font-urbanist">{title}</h1>

      <FormSection
        step={1}
        variant="main"
        title="Votre profil"
        description="Identité du responsable du compte"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField id="firstname" label="Prénom" required>
            <input
              id="firstname"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              required
              className={formInputClass}
            />
          </FormField>
          <FormField id="lastname" label="Nom" required>
            <input
              id="lastname"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              required
              className={formInputClass}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        step={2}
        variant="sky"
        title="Entreprise"
        description="Informations de votre organisation"
      >
        <FormField id="companyName" label="Nom de la société">
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nom de la société"
            className={formInputClass}
          />
        </FormField>
        <FormField id="address" label="Adresse">
          <SimpleAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Ex : 12 Rue de Rivoli, Paris"
          />
        </FormField>
      </FormSection>

      <FormSection
        step={3}
        variant="tertiary"
        title="Accès"
        description="Identifiants de connexion"
      >
        <FormField id="email" label="Adresse e-mail" required>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={placeholderText}
            className={formInputClass}
          />
        </FormField>
        <FormField id="password" label="Mot de passe" required>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={placeholderTextPswrd}
            required
            className={formInputClass}
          />
        </FormField>
      </FormSection>

      {errorMsg ? (
        <p className="mb-4 text-[var(--color-secondary)] text-body-small font-poppins">
          {errorMsg}
        </p>
      ) : null}

      <MainButton
        color="bg-[var(--color-text)] font-poppins text-body-large w-full md:w-auto min-w-[200px]"
        text={buttonText}
        type="submit"
      />
    </form>
  );
};

export default RegisterForm;
