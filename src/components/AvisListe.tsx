/** Liste d'avis publiés (étoiles, texte, auteur). */

import type { Avis } from "@/lib/reviews";

export function Etoiles({ note, taille = "text-base" }: { note: number; taille?: string }) {
  return (
    <span className={`${taille} tracking-wide`} aria-label={`${note} sur 5`}>
      <span className="text-[#ffd36e]">{"★".repeat(Math.round(note))}</span>
      <span className="text-white/25">{"★".repeat(5 - Math.round(note))}</span>
    </span>
  );
}

export default function AvisListe({ avis }: { avis: Avis[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {avis.map((a) => (
        <li key={a.id} className="carte flex flex-col">
          <Etoiles note={a.note} />
          <blockquote className="mt-3 flex-1 leading-relaxed">« {a.texte} »</blockquote>
          <p className="mt-3 text-sm text-magique-texteClair">
            {a.auteur} · {new Date(a.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </li>
      ))}
    </ul>
  );
}
