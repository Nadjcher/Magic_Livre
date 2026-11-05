"use client";

/**
 * « Un vrai livre pour chaque âge » : on choisit l'âge de l'enfant et l'on voit
 * les types de livres proposés, un extrait d'histoire de cet âge et les styles
 * de dessin adaptés.
 */

import { useState } from "react";
import Link from "next/link";
import { AGE_GROUPS } from "@/lib/ageGroups";
import { BOOK_FORMATS, type BookFormat } from "@/lib/bookFormats";
import { ILLUSTRATION_STYLES } from "@/lib/style_config";

const EXTRAITS: Record<string, string> = {
  "bebe-1-2-ans": "Voici la balle rouge de Léo. Boum, boum ! Elle rebondit. Et toi, où est ta balle ?",
  "3-4-ans": "Un bébé dinosaure sanglote : « J'ai perdu ma maman ! » Kamil lui tend la main : « Petit pas, grand pas, on va la trouver ! »",
  "5-6-ans": "« Suis la voix qui répond sans jamais parler la première », chuchota la carte. Léo réfléchit, puis cria : « Ohé ! »… et l'écho lui montra le chemin.",
  "7-8-ans": "Au sommet de la colline, le grand X rouge était là, mais il n'y avait que du sable. Soudain, le sol trembla : l'île entière ouvrit un œil.",
  "9-12-ans": "Chapitre 3 — La lettre sans expéditeur. Inès relut la phrase pour la troisième fois : pendant la nuit, l'encre bleue avait changé de couleur…",
};

/** Types de livres vraiment faits pour cette tranche (pas ceux qui ne la frôlent qu'à la marge). */
function formatsDuGroupe(type: number, max: number): BookFormat[] {
  return BOOK_FORMATS.filter((f) => f.ageMax >= type && f.ageMin <= max);
}

export default function AgeExplorer() {
  const [slug, setSlug] = useState(AGE_GROUPS[1]!.slug);
  const g = AGE_GROUPS.find((x) => x.slug === slug)!;
  const formats = formatsDuGroupe(g.ageType, g.ageMax);
  const styles = g.styles;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Âge de l'enfant">
        {AGE_GROUPS.map((x) => (
          <button
            key={x.slug}
            type="button"
            role="tab"
            aria-selected={x.slug === slug}
            onClick={() => setSlug(x.slug)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              x.slug === slug ? "border-magique-primaire bg-magique-primaire text-nuit" : "border-white/20 hover:border-white"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <p className="text-magique-texteClair">{g.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {formats.map((f) => (
              <div key={f.id} className="carte p-4">
                <p className="text-2xl" aria-hidden="true">{f.emoji}</p>
                <p className="mt-1 font-semibold">{f.label}</p>
                <p className="text-sm text-magique-texteClair">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <figure className="carte-relief p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-or">Extrait d'un livre pour {g.label}</p>
            <blockquote className="mt-3 font-serif text-lg leading-relaxed">{EXTRAITS[g.slug]}</blockquote>
          </figure>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((s) => (
              <figure key={s} className="overflow-hidden rounded-xl border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/styles/ages/${g.slug}/${s}.webp`} alt={`Style ${ILLUSTRATION_STYLES[s].label}, exemple pour ${g.label}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-2 py-1 text-[11px] font-semibold">{ILLUSTRATION_STYLES[s].label}</figcaption>
              </figure>
            ))}
          </div>
          <Link href={`/livre-personnalise/${g.slug}`} className="inline-block text-sm font-semibold text-magique-primaire hover:underline">
            Tout savoir sur les livres pour {g.label} →
          </Link>
        </div>
      </div>
    </div>
  );
}
