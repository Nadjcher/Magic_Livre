"use client";

/**
 * Fin de l'histoire : « Et demain ? ». L'enfant choisit la suite parmi 3 idées
 * (ou invente la sienne), et l'épisode suivant de sa série s'écrit.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { creerEpisode } from "@/app/actions/serie";

const SUITES_PAR_DEFAUT = [
  "Une nouvelle aventure avec les mêmes amis",
  "Un mystère à résoudre près de la maison",
  "Un voyage vers un endroit jamais vu",
];

export default function EtDemain({
  bookId,
  prenom,
  suites,
  numero,
  autreEpisode,
}: {
  bookId: string;
  prenom: string;
  suites?: string[];
  /** Numéro de cet épisode (1 = le livre). */
  numero: number;
  /** Lien vers l'épisode suivant s'il existe déjà. */
  autreEpisode?: string;
}) {
  const router = useRouter();
  const [idee, setIdee] = useState("");
  const [enCours, start] = useTransition();
  const [erreur, setErreur] = useState<{ texte: string; club?: boolean } | null>(null);
  const choix = suites?.length ? suites : SUITES_PAR_DEFAUT;

  const lancer = (texte: string) =>
    start(async () => {
      setErreur(null);
      const r = await creerEpisode(bookId, texte);
      if (r.ok && r.bookId) router.push(`/bibliotheque/${r.bookId}`);
      else setErreur({ texte: r.message, club: r.club });
    });

  return (
    <div className="mt-6 w-full max-w-lg space-y-4 text-left">
      <p className="text-center font-serif text-2xl text-or-clair">Et demain, {prenom}… ?</p>
      <p className="text-center text-sm text-magique-texteClair">
        Choisis la suite de l'histoire : l'épisode {numero + 1} s'écrit pour toi.
      </p>
      {autreEpisode && (
        <Link href={autreEpisode} className="btn-secondaire w-full">
          Lire l'épisode {numero + 1} déjà écrit
        </Link>
      )}
      <div className="grid gap-2">
        {choix.map((s) => (
          <button
            key={s}
            type="button"
            disabled={enCours}
            onClick={() => lancer(s)}
            className="rounded-2xl border border-magique-trait bg-white/[0.06] px-4 py-3 text-left transition hover:border-magique-primaire disabled:opacity-60"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (idee.trim().length >= 3) lancer(idee);
        }}
      >
        <input
          value={idee}
          onChange={(e) => setIdee(e.target.value)}
          maxLength={200}
          placeholder="Ou ton idée à toi…"
          aria-label="Ton idée pour la suite"
          className="champ flex-1"
        />
        <button className="btn-primaire flex-none" disabled={enCours || idee.trim().length < 3}>
          Go
        </button>
      </form>
      {enCours && <p className="text-center text-sm text-magique-texteClair">L'épisode s'écrit… (1 à 2 minutes)</p>}
      {erreur && (
        <p className="text-center text-sm text-rose-200">
          {erreur.texte}{" "}
          {erreur.club && (
            <Link href="/club" className="font-semibold underline">
              Découvrir le Club
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
