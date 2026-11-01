"use client";

/** Bouton « Créer les illustrations manquantes » (page d'un livre). */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeIllustrations } from "@/app/actions/illustrations";
import Notice from "./Notice";

export default function CompleteIllustrationsButton({ bookId }: { bookId: string }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primaire"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await completeIllustrations(bookId);
            setMessage({ ok: r.ok, text: r.message });
            router.refresh();
          })
        }
      >
        {pending ? "Lancement…" : "🎨 Créer les illustrations manquantes"}
      </button>
      {message && <Notice kind={message.ok ? "succes" : "erreur"}>{message.text}</Notice>}
    </div>
  );
}
