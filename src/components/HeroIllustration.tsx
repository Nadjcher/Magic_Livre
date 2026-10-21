/**
 * Illustration du héros, 100 % vectorielle (nette à toute taille, légère,
 * thématique « conte enchanté »). Remplace l'image matricielle : un livre ouvert
 * d'où s'élève une lumière dorée, quelques étoiles et un croissant de lune.
 */

export default function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 440"
      className={className}
      role="img"
      aria-label="Un livre ouvert d'où s'élève une lumière dorée sous un croissant de lune"
    >
      <defs>
        <radialGradient id="h-glow" cx="50%" cy="38%" r="52%">
          <stop offset="0%" stopColor="#f6e7c4" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#e9a94b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e9a94b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#f2e3c2" />
        </linearGradient>
        <linearGradient id="h-page2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbf2df" />
          <stop offset="100%" stopColor="#ecdab4" />
        </linearGradient>
        <linearGradient id="h-cover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5a1f" />
          <stop offset="100%" stopColor="#6b3f12" />
        </linearGradient>
        <linearGradient id="h-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f6d79a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f6d79a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Halo lumineux */}
      <circle cx="240" cy="178" r="190" fill="url(#h-glow)" />

      {/* Croissant de lune */}
      <g transform="translate(372,70)">
        <circle r="34" fill="#f6e7c4" />
        <circle cx="13" cy="-7" r="29" fill="#1b1544" />
      </g>

      {/* Étoiles à quatre branches */}
      <g fill="#f6d79a">
        <path d="M110 70l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" />
        <path d="M300 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" opacity=".85" />
        <path d="M150 150l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" opacity=".7" />
      </g>
      <g fill="#ffffff">
        <circle cx="80" cy="130" r="2" opacity=".8" />
        <circle cx="350" cy="150" r="2.4" opacity=".7" />
        <circle cx="250" cy="55" r="1.8" opacity=".7" />
        <circle cx="408" cy="120" r="1.6" opacity=".6" />
      </g>

      {/* Faisceau de lumière qui sort du livre */}
      <path d="M240 250L188 150h104z" fill="url(#h-beam)" />

      {/* Petit château doré en silhouette, porté par la lumière */}
      <g fill="#e9a94b" opacity="0.92" transform="translate(240,150)">
        <path d="M-34 44V2l8-8 8 8v8h6V-4l6-6 6 6v6h6V-2l8-8 8 8v46z" />
        <circle cx="-22" cy="-12" r="2.2" fill="#f6e7c4" />
        <circle cx="0" cy="-20" r="2.6" fill="#f6e7c4" />
        <circle cx="22" cy="-14" r="2.2" fill="#f6e7c4" />
        {/* fanions */}
        <path d="M-26 -14l6 2-6 2z" fill="#f6d79a" />
        <path d="M20 -22l6 2-6 2z" fill="#f6d79a" />
      </g>

      {/* ── Le livre ouvert ── */}
      {/* Tranche / couverture (épaisseur) */}
      <path d="M240 330 60 292v22l180 40 180-40v-22z" fill="url(#h-cover)" />
      <path d="M240 352 60 314v-22l180 38 180-38v22z" fill="#5a3410" opacity=".35" />

      {/* Page gauche */}
      <path d="M240 236 72 206 66 300 240 338z" fill="url(#h-page2)" stroke="#d9c190" strokeWidth="1.5" />
      {/* Page droite */}
      <path d="M240 236 408 206 414 300 240 338z" fill="url(#h-page)" stroke="#d9c190" strokeWidth="1.5" />
      {/* Reliure centrale */}
      <path d="M240 236v102" stroke="#cbb078" strokeWidth="2" />

      {/* Lignes de texte suggérées */}
      <g stroke="#cbb485" strokeWidth="3" strokeLinecap="round" opacity=".8">
        <path d="M98 232l108 20M96 250l104 19M94 268l100 18M92 286l92 16" />
        <path d="M382 232L276 252M384 250L280 269M386 268L286 286M388 286L296 302" />
      </g>

      {/* Étincelles qui montent du centre */}
      <g fill="#f6d79a">
        <circle cx="240" cy="210" r="3" />
        <circle cx="222" cy="185" r="2" opacity=".85" />
        <circle cx="258" cy="178" r="2.4" opacity=".85" />
        <circle cx="240" cy="160" r="1.8" opacity=".7" />
      </g>
    </svg>
  );
}
