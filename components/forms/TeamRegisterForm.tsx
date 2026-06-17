"use client";
import { useState, FormEvent, useRef } from "react";
import type { FC, ReactNode, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import MainButton from "@/components/ui/MainButton";
import SimpleAutocomplete from "@/components/ui/SimpleAutocomplete";
import { parseTeamCSV, type TeamMemberInput } from "@/lib/register-team";

interface TeamRegisterFormProps {
  title: ReactNode;
  buttonText: string;
}

const emptyManualMember = (): TeamMemberInput => ({
  firstName: "",
  lastName: "",
  email: "",
  teamName: "",
});

const TeamRegisterForm: FC<TeamRegisterFormProps> = ({ title, buttonText }) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<TeamMemberInput[]>([]);
  const [manualMember, setManualMember] =
    useState<TeamMemberInput>(emptyManualMember);
  const [manualMembers, setManualMembers] = useState<TeamMemberInput[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      setErrorMsg("Veuillez sélectionner un fichier CSV");
      return;
    }

    setCsvFile(file);
    setErrorMsg("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseTeamCSV(text);
      setCsvPreview(parsed);

      if (parsed.length === 0) {
        setErrorMsg(
          "Aucune donnée valide trouvée dans le CSV. Format attendu: email, prénom, nom, équipe (optionnel)",
        );
      } else {
        setSuccessMsg(`${parsed.length} employé(s) trouvé(s) dans le fichier`);
      }
    };
    reader.readAsText(file);
  };

  const handleAddManualMember = () => {
    setErrorMsg("");

    const trimmedMember = {
      firstName: manualMember.firstName.trim(),
      lastName: manualMember.lastName.trim(),
      email: manualMember.email.trim().toLowerCase(),
      teamName: manualMember.teamName?.trim() || "",
    };

    if (
      !trimmedMember.firstName ||
      !trimmedMember.lastName ||
      !trimmedMember.email
    ) {
      setErrorMsg("Prénom, nom et mail sont requis pour ajouter un membre");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedMember.email)) {
      setErrorMsg("Format de mail invalide");
      return;
    }

    if (trimmedMember.email === email.trim().toLowerCase()) {
      setErrorMsg("Le mail du membre ne peut pas être le même que le vôtre");
      return;
    }

    const duplicateInManual = manualMembers.some(
      (member) => member.email.toLowerCase() === trimmedMember.email,
    );
    const duplicateInCsv = csvPreview.some(
      (member) => member.email.toLowerCase() === trimmedMember.email,
    );

    if (duplicateInManual || duplicateInCsv) {
      setErrorMsg("Ce mail est déjà présent dans la liste");
      return;
    }

    setManualMembers((prev) => [...prev, trimmedMember]);
    setManualMember(emptyManualMember());
    setSuccessMsg("");
  };

  const handleRemoveManualMember = (index: number) => {
    setManualMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    const totalMembers = csvPreview.length + manualMembers.length;

    if (totalMembers === 0) {
      setErrorMsg(
        "Ajoutez au moins un membre via le CSV ou le formulaire manuel",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("companyName", companyName);
      formData.append("companyAddress", companyAddress);
      if (csvFile) {
        formData.append("csvFile", csvFile);
      }
      if (manualMembers.length > 0) {
        formData.append("members", JSON.stringify(manualMembers));
      }

      const response = await fetch("/api/register-team", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Erreur lors de l'inscription de l'équipe");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(
        `Inscription réussie ! ${data.usersCreated} utilisateur(s) créé(s). Les emails de création de mot de passe ont été envoyés.`,
      );

      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      setErrorMsg("Erreur de connexion au serveur");
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "w-full px-3 py-2 text-sm bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]";

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto">
      <h1 className="text-h1 mb-8 text-left md:w-2/3 w-full font-urbanist">
        {title}
      </h1>

      <div className="flex flex-row gap-4 mb-4">
        <div className="flex-1">
          <label
            htmlFor="firstname"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Votre prénom
          </label>
          <input
            id="firstname"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            required
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="lastname"
            className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
          >
            Votre nom
          </label>
          <input
            id="lastname"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            required
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
          />
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
        >
          Votre adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex : nomprenom@societe.com"
          required
          className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="companyName"
          className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
        >
          Nom de l&apos;entreprise
        </label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Nom de l'entreprise"
          required
          className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]">
          Adresse de l&apos;entreprise
        </label>
        <SimpleAutocomplete
          value={companyAddress}
          onChange={setCompanyAddress}
          placeholder="Ex : 12 Rue de Rivoli, Paris"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="csvFile"
          className="block mb-1 text-body-large font-poppins text-[var(--color-grey-three)]"
        >
          Fichier CSV de votre équipe
        </label>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-5 py-2 text-base bg-white border-2 border-[var(--color-grey-two)] rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-poppins file:bg-[var(--color-text)] file:text-white hover:file:bg-[var(--color-text)]/90"
          />
          <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
            Format attendu: email, prénom, nom, équipe (optionnel, une ligne par
            employé)
          </p>
        </div>
      </div>

      {csvPreview.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-[var(--color-grey-two)]">
          <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-2">
            <strong>{csvPreview.length}</strong> employé(s) trouvé(s) dans le
            CSV:
          </p>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-body-small">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mail</th>
                  <th className="text-left p-2">Prénom</th>
                  <th className="text-left p-2">Nom</th>
                  <th className="text-left p-2">Équipe</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{row.email}</td>
                    <td className="p-2">{row.firstName}</td>
                    <td className="p-2">{row.lastName}</td>
                    <td className="p-2">{row.teamName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvPreview.length > 10 && (
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                ... et {csvPreview.length - 10} autre(s)
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-3">
          Ou ajoutez vos membres manuellement
        </p>
        <div className="flex flex-row gap-2 items-end">
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-body-small font-poppins text-[var(--color-grey-three)]">
              Prénom
            </label>
            <input
              type="text"
              value={manualMember.firstName}
              onChange={(e) =>
                setManualMember((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              placeholder="Prénom"
              className={inputClassName}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-body-small font-poppins text-[var(--color-grey-three)]">
              Nom
            </label>
            <input
              type="text"
              value={manualMember.lastName}
              onChange={(e) =>
                setManualMember((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              placeholder="Nom"
              className={inputClassName}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-body-small font-poppins text-[var(--color-grey-three)]">
              Mail
            </label>
            <input
              type="email"
              value={manualMember.email}
              onChange={(e) =>
                setManualMember((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="mail@exemple.com"
              className={inputClassName}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-body-small font-poppins text-[var(--color-grey-three)]">
              Équipe
            </label>
            <input
              type="text"
              value={manualMember.teamName}
              onChange={(e) =>
                setManualMember((prev) => ({
                  ...prev,
                  teamName: e.target.value,
                }))
              }
              placeholder="Équipe"
              className={inputClassName}
            />
          </div>
          <button
            type="button"
            onClick={handleAddManualMember}
            className="shrink-0 bg-[var(--color-secondary)] text-white w-10 h-10 rounded-full hover:opacity-90 transition flex items-center justify-center text-xl font-bold"
            aria-label="Ajouter ce membre"
          >
            +
          </button>
        </div>
      </div>

      {manualMembers.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-[var(--color-grey-two)]">
          <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-2">
            <strong>{manualMembers.length}</strong> membre(s) ajouté(s)
            manuellement:
          </p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-body-small">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Prénom</th>
                  <th className="text-left p-2">Nom</th>
                  <th className="text-left p-2">Mail</th>
                  <th className="text-left p-2">Équipe</th>
                  <th className="text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {manualMembers.map((member, index) => (
                  <tr key={`${member.email}-${index}`} className="border-b">
                    <td className="p-2">{member.firstName}</td>
                    <td className="p-2">{member.lastName}</td>
                    <td className="p-2">{member.email}</td>
                    <td className="p-2">{member.teamName || "—"}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveManualMember(index)}
                        className="text-[var(--color-secondary)] underline"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 text-red-600 text-body-small font-poppins">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 text-green-600 text-body-small font-poppins">
          {successMsg}
        </div>
      )}

      <div className="md:w-1/5 w-full mb-8">
        <MainButton
          color="bg-[var(--color-text)] font-poppins text-body-large"
          text={isSubmitting ? "Inscription en cours..." : buttonText}
          type="submit"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};

export default TeamRegisterForm;
