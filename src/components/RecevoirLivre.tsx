"use client";

/** Bouton « Recevoir ce livre » de la sélection du mois (un clic, sans formulaire). */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recevoirLivreDuMois } from "@/app/actions/selection";

export default function RecevoirLivre({ childId, themeId, desactive }: { childId: string; themeId: string; desactive?: boolean }) {
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={pending || desactive}
        onClick={() =>
          start(async () => {
            setErreur(null);
            const r = await recevoirLivreDuMois(childId, themeId);
            if (r.formulaire) return router.push(r.formulaire);
            if (!r.ok) return setErreur(r.message);
            router.refresh();
          })
        }
        className="btn-primaire w-full px-3 py-2 text-sm"
      >
        {pending ? "Préparation…" : "Recevoir ce livre"}
      </button>
      {erreur && <p className="text-xs text-rose-200" role="alert">{erreur}</p>}
    </div>
  );
}
