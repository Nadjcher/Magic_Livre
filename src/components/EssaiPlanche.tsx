"use client";

/** Bouton de l'atelier : essai « planche validée + insertion de l'enfant » sur la page 7 du Petit Poucet. */

import { useState } from "react";
import type { ResultatEssaiPlanche } from "@/lib/essaiPlanche";

export default function EssaiPlanche() {
  const [etat, setEtat] = useState<"repos" | "encours">("repos");
  const [erreur, setErreur] = useState<string | null>(null);
  const [res, setRes] = useState<ResultatEssaiPlanche | null>(null);

  const lancer = async (premium: boolean, planche?: string) => {
    setEtat("encours");
    setErreur(null);
    try {
      const r = await fetch("/api/admin/essai-planche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premium, planche }),
      });
      const j = (await r.json()) as ResultatEssaiPlanche & { erreur?: string };
      if (!r.ok || j.erreur) setErreur(j.erreur ?? "L'essai n'a pas pu tourner.");
      else setRes(j);
    } catch {
      setErreur("L'essai n'a pas pu tourner. Réessayez.");
    }
    setEtat("repos");
  };

  const occupe = etat === "encours";
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => lancer(false)} disabled={occupe} className="btn-secondaire">
        {occupe ? "Dessin en cours… (environ 1 min)" : "Lancer l'essai (2 images, ≈ 0,10 $)"}
      </button>
      {erreur && <p className="text-sm text-rose-200">{erreur}</p>}
      {res && (
        <div className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="space-y-1">
              <img src={res.planche} alt="La planche, sans l'enfant" className="w-full rounded-lg" />
              <figcaption className="text-magique-texteClair">1. La planche, dessinée une seule fois (sans l'enfant)</figcaption>
            </figure>
            <figure className="space-y-1">
              <img src={res.resultat} alt="La planche avec Léo et Caramel ajoutés" className="w-full rounded-lg" />
              <figcaption className="text-magique-texteClair">2. Léo et Caramel ajoutés</figcaption>
            </figure>
          </div>
          <p>
            Coût estimé : {res.cout.toFixed(2).replace(".", ",")} $.
            {res.conservee !== null && (
              <>
                {" "}
                Côté de Poucet resté identique : <strong>{res.conservee} %</strong>
                {res.conservee >= 85 ? " (la planche est conservée)." : " (la planche a été en partie redessinée)."}
              </>
            )}
          </p>
          <p className="text-magique-texteClair">
            À regarder : Poucet et le décor sont-ils les mêmes sur les deux images ? Léo a-t-il ses cheveux et son pyjama ? Caramel est-il un ours ? Poucet
            reste-t-il sous la poitrine de Léo ?
          </p>
          {!/nano-banana|gemini/.test(res.modele) && (
            <button type="button" onClick={() => lancer(true, res.planche)} disabled={occupe} className="btn-secondaire">
              Refaire seulement l'ajout avec le modèle premium (≈ 0,08 $)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
