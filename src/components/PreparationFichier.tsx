"use client";

/**
 * Retour immédiat sur les boutons « Télécharger » : un PDF est fabriqué à la
 * demande (5 à 20 s). Sans signe de vie, on croit que le clic n'a pas marché.
 * Écoute les clics sur les liens /api/books/… et affiche un petit message.
 */

import { useEffect, useState } from "react";

export default function PreparationFichier() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const surClic = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='/api/books/']");
      if (!a || a.getAttribute("href")?.includes("/image")) return;
      setVisible(true);
      clearTimeout(minuteur);
      minuteur = setTimeout(() => setVisible(false), 20_000);
    };
    // Le téléchargement terminé ramène souvent le focus sur la page.
    const surFocus = () => setTimeout(() => setVisible(false), 1500);
    document.addEventListener("click", surClic);
    window.addEventListener("focus", surFocus);
    return () => {
      document.removeEventListener("click", surClic);
      window.removeEventListener("focus", surFocus);
      clearTimeout(minuteur);
    };
  }, []);
  if (!visible) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-nuit px-4 py-3 text-sm text-white shadow-conte sm:inset-x-auto sm:right-6">
      <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-white/30 border-t-or-clair motion-reduce:animate-none" aria-hidden="true" />
      <span>Nous préparons votre fichier (10 à 20 secondes). Le téléchargement démarre tout seul.</span>
      <button type="button" onClick={() => setVisible(false)} className="ml-auto text-white/70 hover:text-white" aria-label="Fermer">
        ×
      </button>
    </div>
  );
}
