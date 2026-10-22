/**
 * Fine couche d'ambiance : quelques étoiles dorées qui scintillent, fixées
 * derrière le contenu. Volontairement discrète pour ne pas gêner la lecture.
 */

function Etoile({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
    </svg>
  );
}

export default function MagicParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Etoile className="anim-scintille absolute h-3 w-3 text-or/40" style={{ top: "12%", left: "6%" }} />
      <Etoile className="anim-scintille absolute h-2.5 w-2.5 text-or/30" style={{ top: "26%", right: "8%", animationDelay: "1.2s" }} />
      <Etoile className="anim-scintille absolute h-3.5 w-3.5 text-or/30" style={{ top: "64%", left: "4%", animationDelay: "0.6s" }} />
      <Etoile className="anim-scintille absolute h-2.5 w-2.5 text-magique-primaire/25" style={{ bottom: "10%", right: "6%", animationDelay: "1.8s" }} />
      <Etoile className="anim-scintille absolute h-2 w-2 text-or/30" style={{ top: "44%", right: "14%", animationDelay: "2.4s" }} />
    </div>
  );
}
