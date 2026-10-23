"use client";

/**
 * La « boutique » du livre : tous les produits dérivés inclus avec l'achat,
 * à télécharger, imprimer et offrir (coloriage, affiche, invitation,
 * autocollants, marque-pages, audio).
 */

import { useState } from "react";
import Notice from "./Notice";

type Produit = {
  cle: string;
  emoji: string;
  titre: string;
  desc: string;
  href?: string; // produit PDF à télécharger
};

const PRODUITS: Produit[] = [
  { cle: "coloriage", emoji: "🖍️", titre: "Cahier de coloriage", desc: "L'histoire en pages à colorier.", href: "coloriage/pdf" },
  { cle: "poster", emoji: "🖼️", titre: "Affiche du héros", desc: "Le héros en grand, pour la chambre.", href: "poster/pdf" },
  { cle: "invitation", emoji: "🎉", titre: "Carte d'invitation", desc: "Pour une fête à son image.", href: "invitation/pdf" },
  { cle: "stickers", emoji: "⭐", titre: "Planche d'autocollants", desc: "Les illustrations à découper.", href: "stickers/pdf" },
  { cle: "marque-pages", emoji: "🔖", titre: "Marque-pages", desc: "Trois marque-pages à découper.", href: "marque-pages/pdf" },
];

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
      <h2 className="font-serif text-xl">La boutique du livre ✨</h2>
      <p className="mb-4 mt-1 text-sm text-magique-texteClair">
        Tout est inclus avec votre achat : à télécharger, imprimer et offrir.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUITS.map((p) => (
          <a
            key={p.cle}
            href={`/api/books/${bookId}/${p.href}`}
            className="group flex items-start gap-3 rounded-2xl border border-magique-trait bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-magique-primaire hover:shadow-or"
          >
            <span className="text-2xl" aria-hidden="true">{p.emoji}</span>
            <span>
              <span className="block font-semibold text-magique-texte">{p.titre}</span>
              <span className="block text-sm text-magique-texteClair">{p.desc}</span>
              <span className="mt-1 inline-block text-sm font-semibold text-magique-primaire">
                Télécharger →
              </span>
            </span>
          </a>
        ))}

        {/* Audio : téléchargement via fetch (pas un simple lien). */}
        <button
          onClick={telechargerAudio}
          disabled={pending}
          className="group flex items-start gap-3 rounded-2xl border border-magique-trait bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-magique-primaire hover:shadow-or disabled:opacity-60"
        >
          <span className="text-2xl" aria-hidden="true">🎧</span>
          <span>
            <span className="block font-semibold text-magique-texte">Histoire audio (MP3)</span>
            <span className="block text-sm text-magique-texteClair">La voix qui raconte, à emporter.</span>
            <span className="mt-1 inline-block text-sm font-semibold text-magique-primaire">
              {pending ? "Préparation…" : "Télécharger →"}
            </span>
          </span>
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
