/**
 * Couverture d'un livre avec son titre et le prénom de l'enfant imprimés en
 * haut, comme sur le livre relié : « Le Noël magique / de Léo ».
 * Le texte se dimensionne sur la largeur de la couverture (unités cqw), donc
 * la même couverture marche en vignette comme en grand. En vignette (compact),
 * seul le prénom est affiché.
 */

import type { ReactNode } from "react";
import { dePrenom, separerTitre } from "@/lib/titrePrenom";

const PRENOMS_EXEMPLE = ["Léo", "Jade", "Inès", "Gabriel", "Louise", "Adam", "Lina", "Tom", "Rose", "Noé", "Emma", "Sacha"];

/** Un prénom d'exemple stable pour un thème (vitrines, catalogue). */
export function prenomExemple(cle: string): string {
  let h = 0;
  for (const c of cle) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PRENOMS_EXEMPLE[h % PRENOMS_EXEMPLE.length] as string;
}

const ombre = "[text-shadow:0_2px_10px_rgba(8,14,48,.8),0_1px_2px_rgba(8,14,48,.9)]";

export default function CouvertureLivre({
  src,
  prenom,
  titre,
  pourPrenom = false,
  compact = false,
  alt = "",
  priorite = false,
  className = "",
  children,
}: {
  src: string | null;
  prenom?: string | null;
  /** Titre sans le prénom (thème), ou titre complet se terminant par le prénom (livre). */
  titre?: string;
  /** Ancien livre dont le titre ne contient pas le prénom : « pour Léo » en petit. */
  pourPrenom?: boolean;
  /** Vignette : seul le prénom. */
  compact?: boolean;
  alt?: string;
  priorite?: boolean;
  className?: string;
  /** Éléments superposés (badge de statut…). */
  children?: ReactNode;
}) {
  const nom = prenom?.trim().slice(0, 18) ?? "";
  const separe = titre && nom ? separerTitre(titre, nom) : null;
  const debut = separe?.debut ?? titre ?? "";
  const de = separe?.de ?? (nom ? dePrenom(nom).de : "");
  const avecDe = Boolean(nom) && !pourPrenom && !compact;
  const tailleNom = Math.min(compact ? 17 : 13, (compact ? 118 : 100) / Math.max(nom.length, 5));
  const tailleTitre = Math.min(8.5, 210 / Math.max(debut.length, 12));

  return (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-l-[4px] rounded-r-xl shadow-conte [container-type:inline-size] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={priorite ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(160deg,#4a5ee8,#16245c)" }} aria-hidden="true" />
      )}
      {(nom || debut) && (
        <div className={`absolute inset-x-0 top-0 ${compact ? "h-[32%]" : "h-[48%]"} bg-gradient-to-b from-[#0b1236]/80 via-[#0b1236]/35 to-transparent`} aria-hidden="true" />
      )}
      <div className="absolute inset-y-0 left-0 w-[4%]" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.45),rgba(255,255,255,.12) 70%,rgba(0,0,0,.1))" }} aria-hidden="true" />

      <div className="absolute inset-x-[7%] top-[6%] text-center text-white">
        {!compact && debut && (
          <p className={`font-serif font-semibold leading-[1.1] ${ombre}`} style={{ fontSize: `${tailleTitre}cqw` }}>
            {debut}
          </p>
        )}
        {nom && (
          <p className={`font-serif leading-none ${ombre} ${compact || avecDe ? "mt-[3%]" : "mt-[2%]"}`}>
            {avecDe && <span className="italic" style={{ fontSize: `${tailleTitre * 0.8}cqw` }}>{de}</span>}
            {pourPrenom && !compact && <span className="italic" style={{ fontSize: "5.5cqw" }}>pour </span>}
            <span className="font-bold tracking-[0.03em]" style={{ fontSize: `${pourPrenom ? 6 : tailleNom}cqw` }}>
              {nom}
            </span>
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
