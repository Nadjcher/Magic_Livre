"use client";

/**
 * Les « petits plus » inclus avec un livre payé : cahier de coloriage, poster,
 * et audio MP3 (si un fournisseur de voix est configuré).
 */

import { useState } from "react";
import Notice from "./Notice";

export default function BookExtras({ bookId }: { bookId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function telechargerAudio() {
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch(`/api/books/${bookId}/audio`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(data.error ?? "L'audio est momentanément indisponible.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "histoire.mp3";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Le téléchargement a échoué. Réessayez plus tard.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="carte">
      <h2 className="font-semibold">Les petits plus ✨</h2>
      <p className="mb-3 mt-1 text-sm text-magique-texteClair">
        Inclus avec votre livre : à imprimer et à partager.
      </p>
      <div className="flex flex-wrap gap-3">
        <a className="btn-secondaire" href={`/api/books/${bookId}/coloriage/pdf`}>
          📖 Cahier de coloriage
        </a>
        <a className="btn-secondaire" href={`/api/books/${bookId}/poster/pdf`}>
          🖼️ Poster du héros
        </a>
        <button className="btn-secondaire" onClick={telechargerAudio} disabled={pending}>
          {pending ? "Préparation…" : "🎧 Audio (MP3)"}
        </button>
      </div>
      {message && (
        <div className="mt-3">
          <Notice kind="info">{message}</Notice>
        </div>
      )}
    </div>
  );
}
