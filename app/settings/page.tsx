"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

type Tab = "compte" | "legal" | "aide";
type LegalDoc = "privacy" | "cgu" | "security" | "mentions" | null;

// ─── Primitives ───────────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-[var(--color-validate)]" : "bg-[var(--color-grey-two)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-1 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 border-b border-[var(--color-grey-two)] text-left hover:bg-[var(--color-grey-one)] px-2 rounded transition-colors"
    >
      <span className="text-body-small font-poppins text-[var(--color-text)]">
        {label}
      </span>
      {value && (
        <span className="text-body-small font-poppins text-[var(--color-grey-three)] flex items-center gap-1">
          {value}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      )}
    </button>
  );
}

function ToggleRow({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--color-grey-two)] px-2">
      <span className="text-body-small font-poppins text-[var(--color-text)]">
        {label}
      </span>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-h3 font-poppins text-[var(--color-text)] mt-8 mb-2">
      {title}
    </h2>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-body-small font-poppins text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition-colors cursor-pointer mb-6"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Légal et Sécurité
    </button>
  );
}

// ─── Legal document contents ──────────────────────────────────────────────────

function DocPrivacy({ onBack }: { onBack: () => void }) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
      <BackButton onClick={onBack} />
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-8">
        Politique de confidentialité
      </h1>

      <DocSection title="Introduction">
        <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-1">
          Dernière mise à jour :{" "}
          <span className="font-semibold">15 juin 2025</span>
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          Chez Glyms, la confidentialité de vos données est une priorité. Nous
          nous engageons à les protéger et à en faire un usage responsable et
          transparent.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Cette politique vous informe sur les données que nous collectons, leur
          utilisation, leur conservation et vos droits.
        </p>
      </DocSection>

      <DocSection title="Qui est responsable du traitement des données ?">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Le responsable du traitement est :
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          [Nom de la société éditrice de Glyms], [forme juridique],
          <br />
          Siège social : 47 Bd de Pesaro, 92000 Nanterre
          <br />
          Immatriculée au RCS de [Ville] sous le n° [SIRET]
          <br />
          Contact : [email RGPD]
        </p>
      </DocSection>

      <DocSection title="Quelles données collectons-nous ?">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Nous collectons différentes données selon votre rôle (Client ou
          Collaborateur) et votre usage de l'application.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-2">
          Données collectées auprès des Clients (utilisateurs principaux) :
        </p>
        <DocList
          items={[
            "Nom, prénom",
            "Adresse e-mail professionnelle",
            "Nom et adresse de la société",
            "Informations de facturation (adresse, statut)",
            "Historique d'événements créés",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-4 mb-2">
          Données collectées auprès des Collaborateurs (invités) :
        </p>
        <DocList
          items={[
            "Prénom",
            "Adresse e-mail professionnelle",
            "Préférences d'activités",
            "Créneaux disponibles",
            "Régimes alimentaires, besoins d'accessibilité",
            "Réponses à des sondages ou formulaires",
          ]}
        />
      </DocSection>

      <DocSection title="Pourquoi collectons-nous ces données ?">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Nous utilisons vos données uniquement pour :
        </p>
        <DocList
          items={[
            "Vous permettre d'accéder à l'application et à votre compte",
            "Créer, gérer et analyser des événements collaboratifs",
            "Émettre des factures et gérer les abonnements",
            "Envoyer des notifications ou rappels (par e-mail)",
            "Générer automatiquement des propositions d'activités",
            "Améliorer notre produit et détecter les bugs",
            "Respecter nos obligations légales (comptabilité, sécurité...)",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-4 font-medium">
          Nous ne revendons jamais vos données.
        </p>
      </DocSection>

      <DocSection title="Avec qui partageons-nous vos données ?">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-4">
          Nous partageons vos données uniquement avec les prestataires suivants,
          dans le respect du RGPD :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-body-small font-poppins border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-grey-two)]">
                {["Finalité", "Sous-traitant", "Localisation", "Garanties"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-2 pr-4 text-[var(--color-grey-three)] font-semibold"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[
                ["Hébergement", "Nom", "Pays", "Données stockées en UE"],
                ["Paiement", "Nom", "Pays", "Clauses contractuelles types"],
                ["Emailing/envoi de lien", "Nom", "Pays", "RGPD compatible"],
                [
                  "Statistiques",
                  "Google Analytics",
                  "EU/US",
                  "Consentement requis",
                ],
              ].map(([fin, sub, loc, gar]) => (
                <tr
                  key={fin}
                  className="border-b border-[var(--color-grey-two)]"
                >
                  <td className="py-3 pr-4 text-[var(--color-text)]">{fin}</td>
                  <td className="py-3 pr-4 text-[var(--color-text)]">{sub}</td>
                  <td className="py-3 pr-4 text-[var(--color-text)]">{loc}</td>
                  <td className="py-3 text-[var(--color-text)]">{gar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Où sont stockées vos données ?">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Vos données sont hébergées sur des serveurs sécurisés situés en France
          ou dans l'Union Européenne, via notre prestataire [Nom de
          l'hébergeur].
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Des sauvegardes automatiques sont effectuées régulièrement.
        </p>
      </DocSection>

      <DocSection title="Quelles mesures de sécurité prenons-nous ?">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Nous avons mis en place :
        </p>
        <DocList
          items={[
            "Connexions chiffrées (HTTPS, TLS)",
            "Mots de passe hashés",
            "Journalisation des accès",
            "Droits d'accès restreints par rôle",
            "Sauvegardes régulières et tests de restauration",
            "Politique d'accès interne stricte",
          ]}
        />
      </DocSection>

      <DocSection title="Vos droits">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Conformément au RGPD, vous disposez de :
        </p>
        <DocList
          items={[
            "Droit d'accès à vos données",
            "Droit de rectification de vos informations",
            "Droit d'effacement (\"droit à l'oubli\")",
            "Droit à la portabilité de vos données",
            "Droit de limitation ou d'opposition à certains traitements",
            "Droit de retrait de votre consentement à tout moment",
          ]}
        />
      </DocSection>

      <DocSection title="Exercer vos droits">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Pour toute demande liée à vos données personnelles, écrivez-nous à :
          [email RGPD], ou via l'espace &ldquo;Mon Compte &gt; Légal et Sécurité
          &gt; Exporter ou supprimer&rdquo;
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Nous vous répondrons dans un délai maximum de 30 jours.
        </p>
      </DocSection>

      <DocSection title="Réclamation auprès de la CNIL">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Si vous estimez, après nous avoir contactés, que vos droits ne sont
          pas respectés, vous pouvez introduire une réclamation auprès de la
          CNIL : https://www.cnil.fr/fr/plaintes
        </p>
      </DocSection>

      <DocSection title="Modifications de cette politique">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Cette politique pourra être mise à jour à tout moment. La date de
          dernière modification sera affichée en haut de cette page. En cas de
          modification majeure, nous vous en informerons.
        </p>
      </DocSection>
    </div>
  );
}

function DocCGU({ onBack }: { onBack: () => void }) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
      <BackButton onClick={onBack} />
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-8">
        Conditions générales d&apos;utilisation (CGU)
      </h1>

      <DocSection title="Introduction">
        <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-1">
          Dernière mise à jour :{" "}
          <span className="font-semibold">15 juin 2025</span>
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          Bienvenue sur Glyms, l&apos;application qui facilite
          l&apos;organisation d&apos;événements collaboratifs pour les
          entreprises.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Merci de lire attentivement ces Conditions Générales
          d&apos;Utilisation (CGU), car elles régissent l&apos;accès et
          l&apos;utilisation de notre plateforme web et mobile.
        </p>
      </DocSection>

      <DocSection title="Objet">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Les présentes CGU ont pour objet de définir les modalités
          d&apos;utilisation du service Glyms, proposé par la société Nom de la
          société, ci-après désignée &ldquo;l&apos;Éditeur&rdquo;.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Glyms permet à un utilisateur (entreprise cliente) de créer des
          événements, d&apos;inviter des collaborateurs, de récolter leurs
          préférences, et de recevoir des suggestions automatisées
          d&apos;activités selon les contraintes exprimées.
        </p>
      </DocSection>

      <DocSection title="Utilisateurs concernés">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Glyms s&apos;adresse à deux types d&apos;utilisateurs :
        </p>
        <DocList
          items={[
            "Les Clients : entreprises ou représentants légaux abonnés au service.",
            "Les Collaborateurs : personnes invitées à participer à un événement par un Client (salariés, équipes, prestataires...).",
          ]}
        />
      </DocSection>

      <DocSection title="Inscription & création de compte">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          La création de compte est obligatoire pour :
        </p>
        <DocList
          items={[
            "Les Clients (entreprises) lors de la souscription.",
            "Les Collaborateurs uniquement s'ils souhaitaient interagir via la plateforme (remplir le formulaire, consulter les infos...).",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          L&apos;utilisateur s&apos;engage à fournir des informations exactes, à
          jour et complètes.
        </p>
      </DocSection>

      <DocSection title="Accès au service">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Le service est accessible via :
        </p>
        <DocList
          items={[
            "Une interface web à l'adresse : URL de l'application",
            "Une application mobile, téléchargeable via QR Code ou les stores Android/iOS.",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-4 mb-3">
          L&apos;accès est conditionné par :
        </p>
        <DocList
          items={[
            "Un abonnement actif (mensuel, trimestriel, annuel).",
            "La validation des présentes CGU et de la politique de confidentialité.",
          ]}
        />
      </DocSection>

      <DocSection title="Abonnement, prix et facturation">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Formules disponibles :
        </p>
        <DocList
          items={[
            "Mensuel – sans engagement",
            "Trimestriel – engagement 3 mois",
            "Annuel – engagement 12 mois",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-4">
          Le Client peut mettre en pause, modifier ou résilier son abonnement à
          tout moment via l&apos;espace &ldquo;Mon compte&rdquo;.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Les paiements sont sécurisés via [nom de ton prestataire de paiement]
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Une facture est émise à chaque échéance et disponible en
          téléchargement via la plateforme.
        </p>
      </DocSection>

      <DocSection title="Contenu du service">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Glyms offre notamment :
        </p>
        <DocList
          items={[
            "La création rapide d'un événement.",
            "L'ajout manuel ou en masse de collaborateurs.",
            "L'envoi automatisé de liens pour remplir les préférences (date, heure, type de sortie, besoins particuliers).",
            "L'analyse et le matching intelligent pour générer 3 propositions d'activités.",
            "Un espace de suivi : statut des réponses, documents joints, infos pratiques...",
          ]}
        />
      </DocSection>

      <DocSection title="Engagements et responsabilités de l'utilisateur">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          L&apos;utilisateur s&apos;engage à :
        </p>
        <DocList
          items={[
            "Utiliser Glyms de manière conforme à la loi et aux présentes CGU.",
            "Ne pas partager ses identifiants.",
            "Respecter les données personnelles de ses collaborateurs.",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-4">
          L&apos;utilisateur reste{" "}
          <span className="font-semibold">seul responsable</span> des contenus
          qu&apos;il renseigne sur la plateforme (nom d&apos;événement,
          documents, données collaborateur...).
        </p>
      </DocSection>

      <DocSection title="Algorithme de suggestion">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Glyms utilise un algorithme maison pour croiser :
        </p>
        <DocList
          items={[
            "Les créneaux horaires compatibles",
            "Les types de sorties préférés",
            "Les contraintes d'accessibilité ou alimentaires",
          ]}
        />
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-4">
          Les{" "}
          <span className="font-semibold">
            propositions ne sont pas contractuelles
          </span>
          . Le client reste libre de les accepter, modifier ou ignorer.
        </p>
      </DocSection>

      <DocSection title="Résiliation">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Le Client peut résilier son abonnement à tout moment.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          L&apos;accès sera maintenu jusqu&apos;à la fin de la période engagée
          (mensuelle, trimestrielle ou annuelle).
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Aucune résiliation anticipée ne donne droit à un remboursement sauf
          cas exceptionnels (panne prolongée, faute de l&apos;Éditeur...).
        </p>
      </DocSection>

      <DocSection title="Propriété intellectuelle">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Tous les contenus de Glyms (logos, illustrations, algorithmes,
          interface, textes, animations) sont la propriété exclusive de Nom de
          la société.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Aucune reproduction, modification, distribution n&apos;est autorisée
          sans accord écrit.
        </p>
      </DocSection>

      <DocSection title="Données personnelles">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Les données sont traitées conformément au RGPD.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Voir notre{" "}
          <span className="underline cursor-pointer">
            Politique de confidentialité
          </span>
          .
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Vous pouvez exercer vos droits d&apos;accès, rectification,
          suppression à : [email RGPD].
        </p>
      </DocSection>

      <DocSection title="Disponibilité & maintenance">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Glyms est disponible 7j/7, 24h/24.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Des interruptions temporaires peuvent avoir lieu pour maintenance.
          Elles seront, autant que possible, communiquées en amont via
          l&apos;interface.
        </p>
      </DocSection>

      <DocSection title="Modifications des CGU">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          L&apos;Éditeur peut modifier les présentes CGU à tout moment.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          L&apos;utilisateur en sera informé à la prochaine connexion et devra
          les accepter pour continuer à utiliser le service.
        </p>
      </DocSection>

      <DocSection title="Droit applicable & litiges">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Les présentes CGU sont régies par le droit français.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Tout litige sera soumis à la compétence exclusive des tribunaux du
          ressort du siège de la société.
        </p>
      </DocSection>
    </div>
  );
}

function SubSectionTitle({ title }: { title: string }) {
  return (
    <p className="text-body-small font-poppins font-semibold text-[var(--color-text)] mt-4 mb-2">
      {title}
    </p>
  );
}

function DocSecurity({ onBack }: { onBack: () => void }) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
      <BackButton onClick={onBack} />
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-8">
        Politique de sécurité des données
      </h1>

      <DocSection title="Introduction">
        <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-1">
          Dernière mise à jour :{" "}
          <span className="font-semibold">15 juin 2025</span>
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          Chez Glyms, nous mettons la sécurité de vos données au c&oelig;ur de
          nos priorités. Cette politique décrit les mesures techniques et
          organisationnelles mises en place pour garantir la confidentialité,
          l&apos;intégrité et la disponibilité de vos données personnelles et
          professionnelles.
        </p>
      </DocSection>

      <DocSection title="Objectif de cette politique">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Cette politique a pour but de :
        </p>
        <DocList
          items={[
            "Informer nos utilisateurs de notre approche en matière de sécurité.",
            "Garantir un niveau de protection conforme aux exigences du RGPD.",
            "Prévenir les risques de fuite, de perte ou d'accès non autorisé aux données.",
          ]}
        />
      </DocSection>

      <DocSection title="Nature des données protégées">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Les mesures décrites ici concernent :
        </p>
        <DocList
          items={[
            "Vos données personnelles (nom, prénom, e-mail, préférences).",
            "Vos informations de compte (mot de passe, identifiants).",
            "Vos informations de facturation.",
            "Les données renseignées par les collaborateurs dans les formulaires d'événement.",
          ]}
        />
      </DocSection>

      <DocSection title="Mesures de sécurité techniques">
        <SubSectionTitle title="Chiffrement des données" />
        <DocList
          items={[
            "Toutes les communications sont chiffrées via HTTPS/TLS (SSL).",
            "Les mots de passe sont hachés avec un algorithme robuste.",
            "Les tokens d'authentification sont signés et expirent automatiquement.",
          ]}
        />
        <SubSectionTitle title="Infrastructure et hébergement" />
        <DocList
          items={[
            "Données hébergées chez [Nom de l'hébergeur], en France ou en UE.",
            "Sauvegardes automatiques quotidiennes avec conservation sur 30 jours.",
            "Séparation logique des environnements (dev / staging / prod).",
          ]}
        />
        <SubSectionTitle title="Protection des accès" />
        <DocList
          items={[
            "Authentification par session sécurisée (avec expiration automatique).",
            "Droits d'accès limités par rôle utilisateur (collaborateur / admin).",
            "Journalisation des accès sensibles.",
          ]}
        />
      </DocSection>

      <DocSection title="Mesures de sécurité organisationnelles">
        <div className="space-y-1">
          {[
            "Sensibilisation de l'équipe aux bonnes pratiques de sécurité.",
            "Procédures de gestion des incidents internes.",
            "Revue régulière des accès aux bases de données.",
            "Processus de contrôle qualité avant mise en production.",
            "Engagements de confidentialité signés par tous les collaborateurs.",
          ].map((item) => (
            <p
              key={item}
              className="text-body-small font-poppins text-[var(--color-text)]"
            >
              {item}
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection title="Gestion des vulnérabilités et mises à jour">
        <div className="space-y-1">
          {[
            "Mises à jour régulières de la stack logicielle (framework, dépendances).",
            "Surveillance des CVE (failles connues) et patchs de sécurité déployés dès publication.",
            "Tests manuels et automatiques à chaque version majeure.",
          ].map((item) => (
            <p
              key={item}
              className="text-body-small font-poppins text-[var(--color-text)]"
            >
              {item}
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection title="Gestion des incidents">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          En cas d&apos;incident de sécurité (ex. : faille, accès non autorisé,
          perte de données) :
        </p>
        <DocList
          items={[
            "Notification de la CNIL dans un délai de 72h si nécessaire.",
            "Notification des utilisateurs concernés (via email ou interface).",
            "Mise en œuvre immédiate d'actions correctives.",
          ]}
        />
      </DocSection>

      <DocSection title="Fin de contrat et suppression des données">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Lorsqu&apos;un client clôture son compte :
        </p>
        <DocList
          items={[
            "Ses données sont archivées pendant 30 jours (en cas de réactivation), puis supprimées.",
            "Les collaborateurs liés sont également anonymisés ou supprimés.",
            "Les sauvegardes conservant les données sont écrasées automatiquement après expiration du cycle de conservation.",
          ]}
        />
      </DocSection>

      <DocSection title="Certification et conformité">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          Bien que Glyms ne dispose pas encore de certification ISO 27001 ou
          équivalente, nous suivons les bonnes pratiques en matière de
          cybersécurité SaaS :
        </p>
        <DocList
          items={[
            "Conformité au RGPD",
            "Séparation des environnements",
            "Revue de code sécurisée",
            "Audit de sécurité interne semestriel",
          ]}
        />
      </DocSection>

      <DocSection title="Contact en cas de question">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Pour toute question relative à la sécurité de vos données : [email
          sécurité ou DPO]
        </p>
      </DocSection>

      <DocSection title="Révision de cette politique">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Cette politique peut être modifiée à tout moment. La date de dernière
          mise à jour figure en haut de cette page. En cas de changements
          importants, une notification vous sera transmise lors de votre
          prochaine connexion.
        </p>
      </DocSection>
    </div>
  );
}

function DocMentions({ onBack }: { onBack: () => void }) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
      <BackButton onClick={onBack} />
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-8">
        Mentions Légales
      </h1>

      <DocSection title="Introduction">
        <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-1">
          Dernière mise à jour :{" "}
          <span className="font-semibold">15 Juin 2025</span>
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          Conformément aux dispositions des articles 6-III et 19 de la loi
          n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
          numérique, dite LCEN, les présentes mentions légales sont portées à la
          connaissance des utilisateurs de l&apos;application Glyms.
        </p>
      </DocSection>

      <DocSection title="Éditeur de l'application">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          L&apos;application Glyms est éditée par :
        </p>
        <div className="space-y-0.5">
          {[
            "Nom de la société",
            "Forme juridique :",
            "Capital social :",
            "Siège social : 47 Bd de Pesaro, 92000 Nanterre",
            "Immatriculée au RCS de [Ville] sous le numéro [RCS/SIRET]",
            "Directeur de la publication : Nom",
            "Email de contact : adresse email professionnelle",
          ].map((line) => (
            <p
              key={line}
              className="text-body-small font-poppins text-[var(--color-text)]"
            >
              {line}
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection title="Hébergement">
        <p className="text-body-small font-poppins text-[var(--color-text)] mb-3">
          L&apos;application est hébergée par :
        </p>
        <div className="space-y-0.5">
          {[
            "[Nom de l'hébergeur]",
            "Adresse : [adresse complète de l'hébergeur]",
            "Téléphone : [numéro du support ou du siège]",
            "Site web : [URL de l'hébergeur]",
          ].map((line) => (
            <p
              key={line}
              className="text-body-small font-poppins text-[var(--color-text)]"
            >
              {line}
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection title="Propriété intellectuelle">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Tous les éléments accessibles sur l&apos;application, notamment les
          textes, images, graphismes, logo, icônes, sons, logiciels, sont
          protégés par les droits de propriété intellectuelle et sont la
          propriété exclusive de Glyms, sauf mentions contraires.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          Toute reproduction, représentation, modification, publication,
          adaptation de tout ou partie des éléments du site/app, quel que soit
          le moyen ou le procédé utilisé, est interdite, sauf autorisation
          écrite préalable.
        </p>
      </DocSection>

      <DocSection title="Responsabilité">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Glyms s&apos;efforce d&apos;assurer au mieux l&apos;accès, la sécurité
          et le bon fonctionnement de l&apos;application. Toutefois, elle ne
          saurait être tenue responsable des interruptions de service, bugs,
          inexactitudes ou dommages indirects résultant de l&apos;utilisation de
          l&apos;application.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          L&apos;utilisateur reste seul responsable de l&apos;usage qu&apos;il
          fait du service.
        </p>
      </DocSection>

      <DocSection title="Données personnelles">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Les informations recueillies via l&apos;application font l&apos;objet
          d&apos;un traitement informatique destiné à fournir le service
          proposé, gérer les comptes utilisateurs, améliorer l&apos;expérience,
          et respecter nos obligations légales.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-3">
          Conformément au Règlement Général sur la Protection des Données
          (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification,
          de suppression, de limitation du traitement et de portabilité de vos
          données.
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Pour exercer vos droits, contactez-nous à : [email RGPD ou formulaire]
        </p>
        <p className="text-body-small font-poppins text-[var(--color-text)] mt-2">
          Plus d&apos;informations sont disponibles dans notre{" "}
          <span className="underline cursor-pointer">
            Politique de confidentialité.
          </span>
        </p>
      </DocSection>

      <DocSection title="Droit applicable">
        <p className="text-body-small font-poppins text-[var(--color-text)]">
          Les présentes mentions légales sont régies par le droit français. En
          cas de litige, les tribunaux compétents seront ceux du ressort du
          siège social de la société.
        </p>
      </DocSection>
    </div>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-h3 font-poppins text-[var(--color-text)] mb-3">
        {title}
      </h2>
      <div className="pl-4">{children}</div>
    </div>
  );
}

function DocList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-body-small font-poppins text-[var(--color-text)]"
        >
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--color-main)] flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function TabCompte({ onDeleteAccount }: { onDeleteAccount: () => void }) {
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(false);

  return (
    <div>
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-6">
        Votre Compte
      </h1>

      <SectionTitle title="Informations du compte" />
      <div className="border-t border-[var(--color-grey-two)]">
        <SettingRow label="Région" value="France" />
        <SettingRow label="Langue" value="Français" />
      </div>

      <SectionTitle title="Synchronisation" />
      <div className="border-t border-[var(--color-grey-two)]">
        <ToggleRow
          label="Synchroniser votre calendrier"
          enabled={syncCalendar}
          onChange={setSyncCalendar}
        />
      </div>

      <SectionTitle title="Vos Préférences" />
      <div className="border-t border-[var(--color-grey-two)]">
        <ToggleRow
          label="Recevoir des notifications"
          enabled={receiveNotifications}
          onChange={setReceiveNotifications}
        />
      </div>

      <div className="mt-10">
        <button
          type="button"
          onClick={onDeleteAccount}
          className="px-5 py-2.5 bg-[var(--color-secondary)] text-white font-poppins text-body-small rounded-lg hover:opacity-90 transition cursor-pointer"
        >
          Supprimer le compte
        </button>
      </div>
    </div>
  );
}

function TabLegal() {
  const [openDoc, setOpenDoc] = useState<LegalDoc>(null);

  if (openDoc === "privacy")
    return <DocPrivacy onBack={() => setOpenDoc(null)} />;
  if (openDoc === "cgu") return <DocCGU onBack={() => setOpenDoc(null)} />;
  if (openDoc === "security")
    return <DocSecurity onBack={() => setOpenDoc(null)} />;
  if (openDoc === "mentions")
    return <DocMentions onBack={() => setOpenDoc(null)} />;

  return (
    <div>
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-6">
        Légal et Sécurité
      </h1>

      <div className="border-t border-[var(--color-grey-two)]">
        <SettingRow
          label="Politique de confidentialité"
          value="Voir"
          onClick={() => setOpenDoc("privacy")}
        />
        <SettingRow
          label="Conditions générales d'utilisation"
          value="Voir"
          onClick={() => setOpenDoc("cgu")}
        />
        <SettingRow
          label="Politique de sécurité des données"
          value="Voir"
          onClick={() => setOpenDoc("security")}
        />
        <SettingRow
          label="Mentions Légales"
          value="Voir"
          onClick={() => setOpenDoc("mentions")}
        />
      </div>

      <SectionTitle title="Mes données" />
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          className="px-5 py-2.5 border border-[var(--color-grey-two)] text-[var(--color-grey-three)] font-poppins text-body-small rounded-lg hover:bg-[var(--color-grey-one)] transition cursor-pointer"
        >
          Exporter mes données
        </button>
        <button
          type="button"
          className="px-5 py-2.5 bg-[var(--color-secondary)] text-white font-poppins text-body-small rounded-lg hover:opacity-90 transition cursor-pointer"
        >
          Supprimer mes données
        </button>
      </div>
    </div>
  );
}

function TabAide() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-h2 font-poppins text-[var(--color-text)] mb-6">
        Aide et Support
      </h1>

      <div className="border-t border-[var(--color-grey-two)]">
        <SettingRow label="Foire Aux Questions" value="Voir" />
        <SettingRow
          label="Nous Contacter"
          value="Voir"
          onClick={() => router.push("/contact-us")}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "compte", label: "Votre Compte" },
  { id: "legal", label: "Légal et Sécurité" },
  { id: "aide", label: "Aide et Support" },
];

export default function SettingsPage() {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("compte");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        await logout();
        router.push("/login");
      } else {
        showToast({
          title: "Erreur",
          body: "Impossible de supprimer le compte.",
        });
      }
    } catch {
      showToast({ title: "Erreur", body: "Une erreur est survenue." });
    }
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen font-poppins">
        Chargement...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mt-24 p-10 max-w-7xl mx-auto min-h-[calc(100vh-6rem)]">
      <div className="flex gap-0 min-h-[600px]">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-[var(--color-grey-two)] pr-6 pb-8">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-poppins text-body-small font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--color-grey-one)] text-[var(--color-text)]"
                    : "text-[var(--color-grey-three)] hover:bg-[var(--color-grey-one)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-3 border-2 border-[var(--color-secondary)] text-[var(--color-secondary)] font-poppins text-body-small font-medium rounded-lg hover:bg-[var(--color-secondary)]/10 transition cursor-pointer"
          >
            Déconnexion
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 pl-12">
          {activeTab === "compte" && (
            <TabCompte onDeleteAccount={() => setShowDeleteConfirm(true)} />
          )}
          {activeTab === "legal" && <TabLegal />}
          {activeTab === "aide" && <TabAide />}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-h3 font-poppins text-[var(--color-text)] mb-3">
              Supprimer le compte
            </h2>
            <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-6">
              Cette action est irréversible. Toutes vos données seront
              définitivement supprimées.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmDeleteAccount}
                className="flex-1 py-2.5 bg-[var(--color-secondary)] text-white font-poppins text-body-small rounded-lg hover:opacity-90 transition cursor-pointer"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border-2 border-[var(--color-grey-two)] text-[var(--color-grey-three)] font-poppins text-body-small rounded-lg hover:bg-[var(--color-grey-one)] transition cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
