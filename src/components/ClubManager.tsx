"use client";

/** Gestion de l'abonnement dans « Mon compte » : résilier ou réactiver. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelClub, resumeClub } from "@/app/actions/club";
import Notice from "./Notice";

export default function ClubManager({ resilie }: { resilie: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const agir = (f: typeof cancelClub) =>
    start(async () => {
      const r = await f();
      setMsg({ ok: r.ok, t: r.message });
      router.refresh();
    });
  return (
    <div className="space-y-2">
      {resilie ? (
        <button type="button" className="btn-primaire px-4 py-2 text-sm" disabled={pending} onClick={() => agir(resumeClub)}>
          Garder mon abonnement
        </button>
      ) : (
        <button
          type="button"
          className="text-sm text-magique-texteClair underline"
          disabled={pending}
          onClick={() => {
            if (confirm("Résilier l'abonnement ? Il restera actif jusqu'à la fin du mois déjà payé, et vos livres restent à vous.")) agir(cancelClub);
          }}
        >
          Résilier l'abonnement
        </button>
      )}
      {msg && <Notice kind={msg.ok ? "succes" : "erreur"}>{msg.t}</Notice>}
    </div>
  );
}
