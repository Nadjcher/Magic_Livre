"use client";

/**
 * Livre de la sélection du mois : la jaquette s'ouvre (fenêtre) pour découvrir
 * l'histoire avant de la recevoir.
 */

import { useRef } from "react";
import RecevoirLivre from "./RecevoirLivre";

export default function LivrePropose({
  titre,
  accroche,
  prenom,
  couverture,
  childId,
  themeId,
  desactive,
  children,
}: {
  titre: string;
  accroche: string;
  prenom: string;
  couverture: string | null;
  childId: string;
  themeId: string;
  desactive: boolean;
  children: React.ReactNode;
}) {
  const fenetre = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => fenetre.current?.showModal()}
        className="group block w-full text-left [perspective:1200px]"
        aria-label={`Découvrir « ${titre} »`}
      >
        <div className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5">{children}</div>
      </button>
      <RecevoirLivre childId={childId} themeId={themeId} desactive={desactive} />

      <dialog
        ref={fenetre}
        className="w-[min(92vw,460px)] rounded-3xl bg-nuit p-0 text-white shadow-conte backdrop:bg-[#0b1236]/80"
        onClick={(e) => {
          if (e.target === fenetre.current) fenetre.current?.close();
        }}
      >
        {couverture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={couverture} alt="" className="aspect-[4/3] w-full object-cover object-top" />
        )}
        <div className="space-y-4 p-6">
          <h3 className="font-serif text-2xl">{titre}</h3>
          <p className="text-magique-texteClair">{accroche}</p>
          <p className="text-sm text-or-clair">Avec {prenom} en héros, dessiné comme dans ses livres précédents.</p>
          <RecevoirLivre childId={childId} themeId={themeId} desactive={desactive} />
          <button type="button" onClick={() => fenetre.current?.close()} className="btn-secondaire w-full px-3 py-2 text-sm">
            Plus tard
          </button>
        </div>
      </dialog>
    </>
  );
}
