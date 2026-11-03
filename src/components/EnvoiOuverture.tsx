"use client";

import { useState, useTransition } from "react";
import { envoyerOuverture } from "@/app/actions/lancement";
import Notice from "./Notice";

export default function EnvoiOuverture() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primaire"
        disabled={pending}
        onClick={() => {
          if (confirm("Envoyer l'email d'ouverture à la liste d'attente et à tous les comptes ?")) start(async () => setMsg((await envoyerOuverture()).message));
        }}
      >
        {pending ? "Envoi en cours…" : "Envoyer l'email d'ouverture"}
      </button>
      {msg && <Notice kind="info">{msg}</Notice>}
    </div>
  );
}
