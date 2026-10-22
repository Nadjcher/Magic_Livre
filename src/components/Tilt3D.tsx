"use client";

/**
 * Effet de profondeur 3D léger (parallax / inclinaison au pointeur), sans
 * dépendance ni WebGL : l'élément s'incline doucement vers la souris. Donne un
 * rendu premium et vivant. Désactivé si « réduire les animations » (via CSS).
 */

import { useRef, type ReactNode } from "react";

export default function Tilt3D({
  children,
  className = "",
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  /** Inclinaison maximale en degrés. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={`tilt3d ${className}`}>
      <div className="tilt3d-inner">{children}</div>
    </div>
  );
}
