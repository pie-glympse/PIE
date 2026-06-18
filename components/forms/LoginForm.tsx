"use client";
import { useState, FormEvent } from "react";
import type { FC, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import MainButton from "../ui/MainButton";
import { FormField, formInputClass } from "@/components/ui/form/FormField";
import { FormSection } from "@/components/ui/form/FormSection";

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
  onForgotPassword,
  forgotPasswordText = "Mot de passe oublié ?",
  placeholderText,
  placeholderTextPswrd,
}) => {
  const { setUser, setToken } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setErrorMsg("Erreur serveur: réponse invalide");
        return;
      }

      const responseText = await res.text();
      if (!responseText.trim()) {
        setErrorMsg("Erreur serveur: réponse vide");
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        setErrorMsg("Erreur serveur: format de réponse invalide");
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || `Erreur de connexion (${res.status})`);
        return;
      }

      if (!data.token || !data.user) {
        setErrorMsg("Erreur serveur: données incomplètes");
        return;
      }

      setToken(null);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("token");
      router.push("/home");
    } catch {
      setErrorMsg("Erreur de connexion au serveur");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <h1 className="text-h1 mb-6 text-left font-urbanist">{title}</h1>

      <FormSection
        title="Connexion"
        description="Accédez à votre espace Glyms"
        plain
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

        {errorMsg ? (
          <p className="text-[var(--color-secondary)] text-body-small font-poppins">
            {errorMsg}
          </p>
        ) : null}

        <button
          type="button"
          className="text-[var(--color-grey-three)] text-body-small font-poppins cursor-pointer underline self-end block ml-auto"
          onClick={onForgotPassword}
        >
          {forgotPasswordText}
        </button>
      </FormSection>

      <MainButton
        color="bg-[var(--color-text)] font-poppins text-body-large w-full"
        text={buttonText}
        type="submit"
      />
    </form>
  );
};

export default LoginForm;
