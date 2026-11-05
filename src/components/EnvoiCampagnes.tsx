"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { envoyerCampagneAdmin } from "@/app/actions/lancement";
import Notice from "./Notice";

type Ligne = { id: "avant-premiere" | "ouverture" | "relance" | "noel"; quand: string; titre: string; cible: string; nombre: number };

/** Tableau des campagnes : qui, quand, combien, et le bouton d'envoi (par lots). */
export default function EnvoiCampagnes({ campagnes }: { campagnes: Ligne[] }) {
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <ul className="space-y-3">
      {campagnes.map((c) => (
        <li key={c.id} className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-serif text-lg">{c.titre}</p>
            <p className="text-magique-texteClair">{c.quand} · {c.cible}</p>
            <p className="mt-1">À envoyer : <strong>{c.nombre}</strong> personne{c.nombre > 1 ? "s" : ""}</p>
            {msg[c.id] && <Notice kind="info">{msg[c.id]}</Notice>}
          </div>
          <button
            type="button"
            className="btn-primaire shrink-0 px-5 py-2 text-sm"
            disabled={pending || c.nombre === 0}
            onClick={() => {
              if (confirm(`Envoyer « ${c.titre} » à ${c.nombre} personne(s) ? (par lots de 80, chacun ne la reçoit qu'une fois)`))
                start(async () => {
                  const r = await envoyerCampagneAdmin(c.id);
                  setMsg((m) => ({ ...m, [c.id]: r.message }));
                  router.refresh();
                });
            }}
          >
            {pending ? "Envoi…" : "Envoyer"}
          </button>
        </li>
      ))}
    </ul>
  );
}
