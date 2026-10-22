/**
 * Logo de marque « Mon Livre Magique » : petit livre ouvert surmonté d'une
 * étoile, décliné du favicon. SVG inline pour rester net à toute taille.
 */

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logoFond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="logoEtoile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="120" fill="url(#logoFond)" />
      <g transform="translate(256 300)">
        <path
          d="M-150 -70 C-110 -95 -40 -95 0 -70 L0 70 C-40 45 -110 45 -150 70 Z"
          fill="#FFFBF2"
        />
        <path
          d="M150 -70 C110 -95 40 -95 0 -70 L0 70 C40 45 110 45 150 70 Z"
          fill="#FFF3DC"
        />
        <path d="M0 -70 L0 70" stroke="#C4B5FD" strokeWidth="6" strokeLinecap="round" />
        <g stroke="#C4B5FD" strokeWidth="7" strokeLinecap="round" opacity="0.8">
          <path d="M-120 -40 L-35 -40" />
          <path d="M-120 -10 L-35 -10" />
          <path d="M-120 20 L-45 20" />
          <path d="M35 -40 L120 -40" />
          <path d="M35 -10 L120 -10" />
          <path d="M45 20 L120 20" />
        </g>
      </g>
      <path
        transform="translate(256 120)"
        d="M0 -58 L16 -16 L58 0 L16 16 L0 58 L-16 16 L-58 0 L-16 -16 Z"
        fill="url(#logoEtoile)"
      />
      <circle cx="150" cy="150" r="12" fill="#FDE68A" />
      <circle cx="372" cy="170" r="9" fill="#FDE68A" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className="h-9 w-9 drop-shadow-sm" />
      <span className="font-serif text-xl font-bold text-gradient">Mon Livre Magique</span>
    </span>
  );
}
