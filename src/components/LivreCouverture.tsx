/**
 * Un livre présenté comme un vrai livre : couverture illustrée pleine page,
 * dos ombré, titre imprimé sur la couverture. Utilisé par la bibliothèque et
 * l'espace Club.
 */

import Link from "next/link";

const STATUT: Record<string, { label: string; classe: string }> = {
  draft: { label: "Brouillon", classe: "bg-white/85 text-nuit" },
  generating: { label: "En cours…", classe: "bg-or-clair text-nuit" },
  failed: { label: "Échec", classe: "bg-rose-200 text-nuit" },
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
      <div className="relative aspect-[3/4] overflow-hidden rounded-l-[4px] rounded-r-xl shadow-conte transition duration-300 group-hover:-translate-y-1.5 group-hover:[transform:rotateY(-8deg)] group-focus-visible:-translate-y-1.5">
        {couverture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={couverture}
            alt=""
            loading={priorite ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center font-serif text-6xl text-white/80"
            style={{ backgroundImage: "linear-gradient(160deg,#4a5ee8,#16245c)" }}
            aria-hidden="true"
          >
            {titre.trim().charAt(0).toUpperCase() || "✦"}
          </div>
        )}
        {/* voile pour lire le titre, dos du livre, reflet */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1236]/95 via-[#0b1236]/20 to-transparent" aria-hidden="true" />
        <div className="absolute inset-y-0 left-0 w-3" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.45),rgba(255,255,255,.12) 70%,rgba(0,0,0,.1))" }} aria-hidden="true" />
        {badge && (
          <span className={`absolute left-4 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.classe}`}>{badge.label}</span>
        )}
        <div className="absolute inset-x-4 bottom-3.5 pl-1">
          <p className="line-clamp-3 font-serif text-[15px] leading-snug text-white sm:text-base">{titreAffiche}</p>
          {enfant && <p className="mt-0.5 text-xs text-[#d4dbff]">Pour {enfant}</p>}
        </div>
      </div>
    </Link>
  );
}
