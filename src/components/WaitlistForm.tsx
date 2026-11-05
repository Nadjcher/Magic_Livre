"use client";

/** Inscription à la liste d'attente (email seul). */

import { useState, useTransition } from "react";
import { rejoindreListe } from "@/app/actions/lancement";

export default function WaitlistForm({ source = "accueil" }: { source?: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return <p className="text-sm font-semibold text-emerald-200">✓ {msg.t}</p>;
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      action={(fd) => start(async () => setMsg(await rejoindreListe(fd).then((r) => ({ ok: r.ok, t: r.message }))))}
    >
      <input type="hidden" name="source" value={source} />
      <label className="sr-only" htmlFor={`attente-${source}`}>Votre email</label>
      <input id={`attente-${source}`} name="email" type="email" required placeholder="Votre email" className="champ min-w-0 sm:flex-1" />
      <button type="submit" className="btn-primaire shrink-0 whitespace-nowrap px-5 py-2" disabled={pending}>
        {pending ? "…" : "Me prévenir à l'ouverture"}
      </button>
      {msg && !msg.ok && <p className="text-sm text-red-300">{msg.t}</p>}
    </form>
  );
}
