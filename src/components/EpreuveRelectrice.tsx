"use client";

/** Bouton de l'atelier : lance le jeu d'épreuve de la relectrice et affiche le résultat. */

import { useState } from "react";
import type { ResultatEpreuve } from "@/lib/epreuveRelectrice";

export default function EpreuveRelectrice() {
  const [etat, setEtat] = useState<"repos" | "encours" | "erreur">("repos");
  const [res, setRes] = useState<{ resultats: ResultatEpreuve[]; reussie: boolean } | null>(null);
  const lancer = async () => {
    setEtat("encours");
    try {
      const r = await fetch("/api/admin/epreuve", { method: "POST" });
      setRes(await r.json());
      setEtat("repos");
    } catch {
      setEtat("erreur");
    }
  };
  return (
    <div className="space-y-3">
      <button type="button" onClick={lancer} disabled={etat === "encours"} className="btn-secondaire">
        {etat === "encours" ? "Relecture des 20 images… (1 à 2 min)" : "Lancer le jeu d'épreuve (≈ 0,60 $)"}
      </button>
      {etat === "erreur" && <p className="text-sm text-rose-200">Le jeu d'épreuve n'a pas pu tourner. Réessayez.</p>}
      {res && (
        <div className="space-y-2 text-sm">
          <p className={res.reussie ? "font-semibold text-emerald-300" : "font-semibold text-rose-200"}>
            {res.reussie
              ? "Réussi : les images fautives sont refusées pour la bonne raison, les bonnes sont acceptées."
              : `Échec : ${res.resultats.filter((r) => !r.juste).length} verdict(s) faux sur ${res.resultats.length}. Ne gardez pas cette modification de la relectrice.`}
          </p>
          <ul className="space-y-1">
            {res.resultats.map((r) => (
              <li key={r.id}>
                <strong>{r.juste ? "✓" : "✗"} {r.id}</strong> — {r.attendu === "refusée" ? `défaut : ${r.defaut}` : "bonne image"} · attendu {r.attendu}, obtenu {r.verdict}
                {r.correction ? <span className="text-magique-texteClair"> · « {r.correction.slice(0, 160)} »</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
