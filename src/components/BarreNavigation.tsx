"use client";

/**
 * Fine barre de progression en haut de l'écran : elle démarre DÈS le clic sur
 * un lien interne (réponse immédiate) et disparaît quand la page est affichée.
 */

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function BarreNavigation() {
  const chemin = usePathname();
  const params = useSearchParams();
  const [actif, setActif] = useState(false);

  // Nouvelle page affichée : on termine la barre.
  useEffect(() => {
    setActif(false);
  }, [chemin, params]);

  // Clic sur un lien interne : on démarre la barre tout de suite.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setActif(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#8ea2ff] via-[#d2b6ff] to-[#ff9fd6] transition-[transform,opacity] ${
        actif ? "scale-x-[.85] opacity-100 duration-[2500ms] ease-out" : "scale-x-0 opacity-0 duration-200"
      }`}
    />
  );
}
