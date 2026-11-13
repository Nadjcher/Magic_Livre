"use client";

/** Bouton « Imprimer mon livre » : le parent valide son livre imprimé. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { imprimerMonLivre } from "@/app/actions/impression";
import Notice from "./Notice";

export default function ImprimerLivreButton({ bookId }: { bookId: string }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (message?.ok) return <Notice kind="succes">{message.text}</Notice>;
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primaire"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Envoyer ce livre à l'imprimeur ? Il ne pourra plus être modifié.")) return;
          start(async () => {
            const r = await imprimerMonLivre(bookId);
            setMessage({ ok: r.ok, text: r.message });
            router.refresh();
          });
        }}
      >
        {pending ? "Envoi…" : "Imprimer mon livre"}
      </button>
      {message && <Notice kind="erreur">{message.text}</Notice>}
    </div>
  );
}
