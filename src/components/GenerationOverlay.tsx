"use client";

/**
 * Pendant la fabrication du livre (2 à 4 minutes) : une veillée plutôt qu'une
 * attente. Les étapes du conte s'allument une à une et restent allumées (on
 * voit le travail avancer), et une petite question à poser à l'enfant change
 * toutes les 20 secondes. Aucune animation en boucle décorative.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "./Logo";
import Picto from "./Picto";

const ETAPES = [
  (p: string) => `${p} enfile sa cape de héros`,
  () => "La plume écrit le premier chapitre",
  () => "Les personnages prennent vie",
  () => "Le pinceau mélange les couleurs de la nuit",
  () => "On dessine chaque page",
  () => "On relie les pages du livre",
];

const QUESTIONS = [
  (p: string) => `En attendant, demandez à ${p} : si tu avais un animal magique, comment s'appellerait-il ?`,
  (p: string) => `Petit jeu : ${p}, à ton avis, que va-t-il se passer dans ton histoire ?`,
  () => "Qui imite le mieux le cri du dragon ? Le perdant tourne les pages.",
  (p: string) => `Et si ${p} choisissait le prénom du prochain héros ?`,
  () => "Fermez les yeux et comptez jusqu'à dix : une étoile vient peut-être de tomber dans le livre.",
];

/** Toutes les ~25 s une étape de plus (la dernière reste allumée jusqu'à la fin). */
const PAS_ETAPE = 25_000;
const PAS_QUESTION = 20_000;

/**
 * `inline` : version encart (page du livre) au lieu du plein écran. La création
 * tourne sur le serveur : on peut fermer la page, le livre attendra.
 */
export default function GenerationOverlay({
  inline = false,
  prenom,
  themeId,
}: {
  inline?: boolean;
  prenom?: string;
  themeId?: string;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const debut = Date.now();
    const id = setInterval(() => setT(Date.now() - debut), 1000);
    return () => clearInterval(id);
  }, []);

  const p = prenom?.trim() || "Votre héros";
  const enfant = prenom?.trim() || "votre enfant";
  const etape = Math.min(ETAPES.length - 1, Math.floor(t / PAS_ETAPE));
  const q = Math.floor(t / PAS_QUESTION) % QUESTIONS.length;

  return (
    <div
      className={
        inline
          ? "flex flex-col items-center justify-center rounded-3xl px-6 py-12 text-center shadow-conte"
          : "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center"
      }
      style={{ backgroundImage: "linear-gradient(180deg,#16245c,#0f1a44)" }}
    >
      <div className="anim-flotte">
        <LogoMark className="h-16 w-16" />
      </div>
      <h2 className="mt-5 font-serif text-2xl text-white">{prenom ? `Le conte de ${prenom} s'écrit…` : "Votre conte s'écrit…"}</h2>

      {/* Les étapes s'allument une à une et restent allumées. */}
      <ol className="mt-6 w-full max-w-xs space-y-2 text-left" aria-label="Étapes de fabrication">
        {ETAPES.map((e, k) => (
          <li
            key={k}
            className={`flex items-center gap-3 text-[15px] transition-opacity duration-700 ${k <= etape ? "opacity-100" : "opacity-40"}`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] ${
                k < etape ? "bg-or-clair text-nuit" : k === etape ? "border-2 border-or-clair" : "border border-white/30"
              }`}
            >
              {k < etape ? "✓" : ""}
            </span>
            <span className={k === etape ? "text-white" : "text-[#cdd7f4]"}>{e(p)}</span>
          </li>
        ))}
      </ol>
      {/* Pour les lecteurs d'écran : seulement l'étape en cours. */}
      <p className="sr-only" role="status" aria-live="polite">
        {ETAPES[etape]!(p)}
      </p>

      {/* Une question à poser à l'enfant, qui change toutes les 20 s. */}
      <div key={q} className="anim-fade mt-7 flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white/[0.07] p-4 text-left">
        {themeId ? <Picto cle={`themes/${themeId}`} taille={52} /> : <Picto cle="categories/passions" taille={52} />}
        <p className="text-sm leading-relaxed text-[#e3e8ff]">{QUESTIONS[q]!(enfant)}</p>
      </div>

      <p className="mt-6 max-w-sm text-sm text-[#cdd7f4]">
        Cela prend 2 à 4 minutes. Vous pouvez fermer cette page : la création continue et le livre vous attendra
        dans la bibliothèque.
      </p>
      {!inline && (
        <Link href="/bibliotheque" className="mt-3 inline-flex min-h-11 items-center text-sm text-[#bcd0ff] underline hover:text-white">
          Revenir à ma bibliothèque pendant ce temps
        </Link>
      )}
    </div>
  );
}
