/**
 * Couverture d'un livre avec le PRÉNOM de l'enfant imprimé en grand en haut,
 * comme sur le livre imprimé : on voit tout de suite que le livre est le sien.
 * Le texte se dimensionne sur la largeur de la couverture (unités cqw), donc
 * la même couverture marche en vignette de 64 px comme en grand.
 */

import type { ReactNode } from "react";

const PRENOMS_EXEMPLE = ["Léo", "Jade", "Inès", "Gabriel", "Louise", "Adam", "Lina", "Tom", "Rose", "Noé", "Emma", "Sacha"];

/** Un prénom d'exemple stable pour un thème (vitrines, catalogue). */
export function prenomExemple(cle: string): string {
  let h = 0;
  for (const c of cle) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PRENOMS_EXEMPLE[h % PRENOMS_EXEMPLE.length] as string;
}

export default function CouvertureLivre({
  src,
  prenom,
  titre,
  sousTitre,
  alt = "",
  priorite = false,
  className = "",
  children,
}: {
  src: string | null;
  prenom?: string | null;
  titre?: string;
  sousTitre?: string;
  alt?: string;
  priorite?: boolean;
  className?: string;
  /** Éléments superposés (badge de statut…). */
  children?: ReactNode;
}) {
  const nom = prenom?.trim().slice(0, 18) ?? "";
  // Plus le prénom est long, plus il est petit (il tient toujours sur une ligne).
  const taille = Math.min(15, 118 / Math.max(nom.length, 5));
  return (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-l-[4px] rounded-r-xl shadow-conte [container-type:inline-size] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={priorite ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(160deg,#4a5ee8,#16245c)" }} aria-hidden="true" />
      )}
      {nom && <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-[#0b1236]/75 via-[#0b1236]/30 to-transparent" aria-hidden="true" />}
      {titre && <div className="absolute inset-0 bg-gradient-to-t from-[#0b1236]/95 via-[#0b1236]/15 to-transparent" aria-hidden="true" />}
      <div className="absolute inset-y-0 left-0 w-[4%]" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.45),rgba(255,255,255,.12) 70%,rgba(0,0,0,.1))" }} aria-hidden="true" />
      {nom && (
        <p
          className="absolute inset-x-[6%] top-[6%] text-center font-serif font-bold uppercase leading-none tracking-[0.06em] text-white [text-shadow:0_2px_10px_rgba(8,14,48,.75),0_1px_2px_rgba(8,14,48,.9)]"
          style={{ fontSize: `${taille}cqw` }}
        >
          {nom}
        </p>
      )}
      {titre && (
        <div className="absolute inset-x-[7%] bottom-[5%] pl-[2%]">
          <p className="line-clamp-3 font-serif leading-snug text-white" style={{ fontSize: "max(11px, 7.2cqw)" }}>
            {titre}
          </p>
          {sousTitre && <p className="mt-0.5 text-[#d4dbff]" style={{ fontSize: "max(10px, 5.4cqw)" }}>{sousTitre}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
