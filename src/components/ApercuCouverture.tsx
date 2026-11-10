"use client";

/**
 * Page produit : le parent tape le prénom de son enfant et le voit aussitôt
 * imprimé sur la couverture. Le bouton emporte ce prénom dans le formulaire.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import CouvertureLivre from "./CouvertureLivre";

export default function ApercuCouverture({
  themeId,
  couverture,
  titre,
  prenomParDefaut,
  reserveClub,
  children,
}: {
  themeId: string;
  couverture: string | null;
  titre: string;
  prenomParDefaut: string;
  reserveClub: boolean;
  /** Colonne de droite (titre, bénéfices, prix), placée entre l'aperçu et le bouton. */
  children: ReactNode;
}) {
  const [prenom, setPrenom] = useState("");
  const nom = prenom.replace(/[^\p{L}\s'’-]/gu, "").slice(0, 18);
  const lien = reserveClub ? "/club" : `/creer?theme=${themeId}${nom.trim() ? `&prenom=${encodeURIComponent(nom.trim())}` : ""}`;

  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
      <div className="mx-auto w-full max-w-[14rem] sm:max-w-xs md:sticky md:top-24 md:max-w-sm">
        <div className="[perspective:1400px]">
          <CouvertureLivre
            src={couverture}
            prenom={nom.trim() || prenomParDefaut}
            alt={`Couverture du livre « ${titre} » avec le prénom de l'enfant`}
            priorite
            className="[transform:rotateY(-6deg)] shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]"
          />
        </div>
        <p className="mt-3 text-center text-sm text-magique-texteClair" aria-live="polite">
          {nom.trim() ? `Le livre de ${nom.trim()}` : "Tapez le prénom de votre enfant : il apparaît sur la couverture."}
        </p>
      </div>

      <div className="space-y-6">
        {children}
        <div className="carte space-y-4">
          <label htmlFor="prenom-apercu" className="block font-semibold">
            Le prénom de votre enfant
          </label>
          <input
            id="prenom-apercu"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            maxLength={18}
            autoComplete="off"
            placeholder={`Ex : ${prenomParDefaut}`}
            className="champ"
          />
          <Link href={lien} rel="nofollow" className="btn-primaire w-full text-lg">
            {reserveClub ? "Le lire avec le Club" : nom.trim() ? `Créer le livre de ${nom.trim()}` : "Créer son livre gratuitement"}
          </Link>
          <p className="text-center text-sm text-magique-texteClair">
            Toute l'histoire à lire gratuitement · prête en 3 minutes · sans carte bancaire
          </p>
        </div>
      </div>
    </div>
  );
}
