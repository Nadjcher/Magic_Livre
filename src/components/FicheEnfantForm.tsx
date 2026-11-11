"use client";

/** La fiche d'un enfant pour les histoires (mémoire) : 4 champs facultatifs. */

import { useState, useTransition } from "react";
import { enregistrerFiche } from "@/app/actions/children";
import type { FicheEnfant } from "@/lib/storyPrompt";

const CHAMPS: { nom: keyof FicheEnfant; label: string; exemple: string }[] = [
  { nom: "objet", label: "Son doudou ou objet fétiche", exemple: "Pompon, un lapin gris aux longues oreilles" },
  { nom: "aime", label: "Ce qu'il ou elle aime", exemple: "les dinosaures, faire des cabanes, les crêpes" },
  { nom: "peur", label: "Ce qui lui fait un peu peur", exemple: "le noir, les gros chiens" },
  { nom: "proches", label: "Les proches qu'on peut citer", exemple: "sa petite sœur Inès, mamie Jeanne, le chat Caramel" },
];

export default function FicheEnfantForm({ childId, prenom, fiche }: { childId: string; prenom: string; fiche?: FicheEnfant }) {
  const [enCours, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  return (
    <details className="carte">
      <summary className="cursor-pointer py-1 font-semibold">
        La fiche de {prenom} pour les histoires {fiche && Object.values(fiche).some(Boolean) ? "✓" : "(facultatif)"}
      </summary>
      <form
        className="mt-3 space-y-3"
        action={(fd) =>
          start(async () => {
            const r = await enregistrerFiche(childId, fd);
            setMessage({ ok: r.ok, texte: r.message });
          })
        }
      >
        <p className="text-sm text-magique-texteClair">
          Ces détails rendent ses histoires vraiment à lui : son doudou devient la clé de l'aventure, ses proches y passent.
          Rien n'est inventé à sa place. Vous pouvez tout effacer quand vous voulez.
        </p>
        {CHAMPS.map((c) => (
          <label key={c.nom} className="block text-sm">
            <span className="font-semibold">{c.label}</span>
            <input name={c.nom} defaultValue={fiche?.[c.nom] ?? ""} maxLength={160} placeholder={`Ex : ${c.exemple}`} className="champ mt-1" />
          </label>
        ))}
        <button className="btn-primaire" disabled={enCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && <p className={`text-sm ${message.ok ? "text-magique-texteClair" : "text-rose-200"}`}>{message.texte}</p>}
      </form>
    </details>
  );
}
