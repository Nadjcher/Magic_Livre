"use client";

/**
 * Applique un léger effet de profondeur 3D à TOUT élément portant l'attribut
 * `data-tilt`, via un seul écouteur délégué (pas de dépendance, pas de WebGL).
 * Désactivé au clavier/tactile (pas de survol) et si « réduire les animations ».
 * Monté une fois dans le layout.
 */

import { useEffect } from "react";

export default function TiltProvider() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }

    const MAX = 6; // degrés
    let current: HTMLElement | null = null;

    const reset = (el: HTMLElement) => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    const onMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        "[data-tilt]",
      ) as HTMLElement | null;
      if (target !== current) {
        if (current) reset(current);
        current = target;
      }
      if (!target) return;
      const r = target.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      target.style.setProperty("--ry", `${(px * MAX).toFixed(2)}deg`);
      target.style.setProperty("--rx", `${(-py * MAX).toFixed(2)}deg`);
    };

    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return null;
}
