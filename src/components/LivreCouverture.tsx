/**
 * Un livre présenté comme un vrai livre : couverture illustrée pleine page,
 * dos ombré, titre imprimé sur la couverture. Utilisé par la bibliothèque et
 * l'espace Club.
 */

import Link from "next/link";
import CouvertureLivre from "./CouvertureLivre";

const STATUT: Record<string, { label: string; classe: string }> = {
  draft: { label: "Brouillon", classe: "bg-white/85 text-nuit" },
  generating: { label: "En cours…", classe: "bg-or-clair text-nuit" },
  failed: { label: "À reprendre", classe: "bg-rose-200 text-nuit" },
};

export default function LivreCouverture({
  href,
  titre,
  enfant,
  couverture,
  statut = "ready",
  priorite = false,
}: {
  href: string;
  titre: string;
  enfant?: string;
  couverture: string | null;
  statut?: string;
  priorite?: boolean;
}) {
  const badge = STATUT[statut];
  // Typographie française : pas de « ! » ou « ? » seul en début de ligne.
  const titreAffiche = titre.replace(/ ([!?:;»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  return (
    <Link href={href} className="group block [perspective:1200px]" aria-label={`${titre}${enfant ? `, pour ${enfant}` : ""}`}>
      <div className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5 group-hover:[transform:rotateY(-8deg)] group-focus-visible:-translate-y-1.5">
        <CouvertureLivre src={couverture} prenom={enfant} titre={titreAffiche} priorite={priorite}>
          {badge && (
            <span className={`absolute right-3 top-[22%] rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.classe}`}>{badge.label}</span>
          )}
        </CouvertureLivre>
      </div>
    </Link>
  );
}
