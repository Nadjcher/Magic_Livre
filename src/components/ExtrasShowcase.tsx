/**
 * « Bien plus qu'un simple livre » : les quatre prolongements du livre, chacun
 * avec un vrai aperçu visuel (SVG, léger, net en 3D) plutôt qu'une simple icône.
 * Les cartes sont en relief et s'inclinent au pointeur (via [data-tilt]).
 */

/* ── Aperçu 1 : page de coloriage (trait noir sur papier, un coin colorié) ── */
function ApercuColoriage() {
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" role="img" aria-label="Aperçu d'une page à colorier">
      <rect width="220" height="150" rx="12" fill="#ffffff" />
      <rect x="0.5" y="0.5" width="219" height="149" rx="12" fill="none" stroke="#e6dcc4" />
      {/* Scène en contour */}
      <g fill="none" stroke="#2a2443" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 112c22-6 40-6 62 0" />
        <path d="M150 112c18-5 34-5 52 0" />
        {/* Petit renard */}
        <path d="M86 104c-9 0-16-7-16-16 0-10 7-18 16-18s16 8 16 18c0 9-7 16-16 16z" />
        <path d="M74 76l-5-10 11 4M98 76l5-10-11 4" />
        <circle cx="81" cy="88" r="1.6" fill="#2a2443" />
        <circle cx="91" cy="88" r="1.6" fill="#2a2443" />
        <path d="M86 93v3M83 95h6" />
        {/* Champignon lanterne */}
        <path d="M128 110V92" />
        <path d="M118 92c0-8 5-13 10-13s10 5 10 13z" />
        {/* Étoile */}
        <path d="M170 44l3 7 7 .8-5 5 1.4 7-6.4-3.6-6.4 3.6 1.4-7-5-5 7-.8z" />
      </g>
      {/* Un coin déjà colorié + crayon */}
      <path d="M118 92c0-8 5-13 10-13s10 5 10 13z" fill="#e9a94b" opacity=".55" />
      <g transform="rotate(38 184 112)">
        <rect x="176" y="96" width="9" height="30" rx="2" fill="#39a58f" />
        <path d="M176 96h9l-4.5-9z" fill="#2a2443" />
      </g>
    </svg>
  );
}

/* ── Aperçu 2 : projection murale (veilleuse qui projette un monde) ── */
function ApercuProjection() {
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" role="img" aria-label="Aperçu de la projection murale">
      <defs>
        <radialGradient id="proj-glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#6d3bd1" />
          <stop offset="70%" stopColor="#241a4d" />
          <stop offset="100%" stopColor="#15103a" />
        </radialGradient>
      </defs>
      <rect width="220" height="150" rx="12" fill="url(#proj-glow)" />
      {/* Cône de lumière */}
      <path d="M110 138L58 44h104z" fill="#f6d79a" opacity=".16" />
      {/* Monde projeté */}
      <circle cx="110" cy="66" r="30" fill="#f6d79a" opacity=".14" />
      <g fill="#f6d79a">
        <path d="M96 78V58l5-5 5 5v4h4v-6l5-5 5 5v20z" opacity=".9" />
        <circle cx="90" cy="50" r="1.4" />
        <circle cx="130" cy="54" r="1.6" />
        <circle cx="122" cy="40" r="1.2" />
      </g>
      {/* Étoiles d'ambiance */}
      <g fill="#ffffff">
        <circle cx="30" cy="30" r="1.3" opacity=".8" />
        <circle cx="190" cy="40" r="1.1" opacity=".6" />
        <circle cx="46" cy="100" r="1" opacity=".5" />
      </g>
      {/* Veilleuse */}
      <rect x="98" y="132" width="24" height="12" rx="3" fill="#b9792a" />
      <circle cx="110" cy="132" r="4" fill="#f6d79a" />
    </svg>
  );
}

/* ── Aperçu 3 : lecteur audio avec forme d'onde ── */
function ApercuAudio() {
  const barres = [10, 18, 26, 20, 32, 24, 14, 28, 36, 22, 16, 26, 12, 20, 30, 18, 24, 14];
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" role="img" aria-label="Aperçu du lecteur audio">
      <rect width="220" height="150" rx="12" fill="#faf4e8" />
      <rect x="0.5" y="0.5" width="219" height="149" rx="12" fill="none" stroke="#e6dcc4" />
      {/* Bouton lecture */}
      <circle cx="42" cy="60" r="22" fill="#e9a94b" />
      <path d="M36 50l16 10-16 10z" fill="#3a2708" />
      {/* Forme d'onde */}
      <g fill="#6d3bd1">
        {barres.map((h, i) => (
          <rect
            key={i}
            x={78 + i * 7}
            y={60 - h / 2}
            width="3.4"
            height={h}
            rx="1.7"
            opacity={i < 9 ? 0.9 : 0.3}
          />
        ))}
      </g>
      {/* Barre de progression + temps */}
      <rect x="20" y="108" width="180" height="5" rx="2.5" fill="#e6dcc4" />
      <rect x="20" y="108" width="96" height="5" rx="2.5" fill="#e9a94b" />
      <circle cx="116" cy="110.5" r="6" fill="#ffffff" stroke="#e9a94b" strokeWidth="2" />
      <text x="20" y="132" fill="#6f6690" fontSize="11" fontFamily="sans-serif">1:48</text>
      <text x="182" y="132" fill="#6f6690" fontSize="11" fontFamily="sans-serif">3:30</text>
    </svg>
  );
}

/* ── Aperçu 4 : poster encadré du héros ── */
function ApercuPoster() {
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" role="img" aria-label="Aperçu du poster du héros">
      <rect width="220" height="150" rx="12" fill="#f4e7cc" />
      {/* Cadre */}
      <rect x="62" y="16" width="96" height="118" rx="6" fill="#b9792a" />
      <rect x="68" y="22" width="84" height="106" rx="3" fill="#1b1544" />
      {/* Scène du poster */}
      <defs>
        <linearGradient id="poster-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a6e" />
          <stop offset="100%" stopColor="#1b1544" />
        </linearGradient>
      </defs>
      <rect x="68" y="22" width="84" height="106" rx="3" fill="url(#poster-sky)" />
      <circle cx="132" cy="44" r="10" fill="#f6e7c4" />
      <g fill="#f6d79a">
        <path d="M96 104V74l6-6 6 6v6h5v-9l6-6 6 6v33z" opacity=".95" />
        <circle cx="86" cy="40" r="1.3" />
        <circle cx="112" cy="36" r="1.5" />
      </g>
      {/* Héros (petit renard) */}
      <circle cx="110" cy="100" r="9" fill="#e9a94b" />
      <path d="M103 94l-3-6 7 3M117 94l3-6-7 3" fill="#e9a94b" />
      <circle cx="107" cy="99" r="1.2" fill="#2a2443" />
      <circle cx="113" cy="99" r="1.2" fill="#2a2443" />
    </svg>
  );
}

const EXTRAS = [
  {
    titre: "Livre de coloriage",
    texte: "La même histoire déclinée en pages à colorier, prêtes à imprimer pour les après-midis pluvieux.",
    apercu: <ApercuColoriage />,
  },
  {
    titre: "Projection murale",
    texte: "Un mode veilleuse qui projette les illustrations au plafond, pour s'endormir dans l'histoire.",
    apercu: <ApercuProjection />,
  },
  {
    titre: "Histoire audio",
    texte: "La voix qui raconte, en MP3, pour les trajets en voiture et les yeux déjà fermés.",
    apercu: <ApercuAudio />,
  },
  {
    titre: "Poster du héros",
    texte: "Le portrait du héros en grand format, à afficher fièrement au-dessus du lit.",
    apercu: <ApercuPoster />,
  },
];

export default function ExtrasShowcase() {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2">
      {EXTRAS.map((e) => (
        <article key={e.titre} data-tilt className="carte-relief overflow-hidden p-0">
          <div className="relief-milieu aspect-[220/150] w-full overflow-hidden rounded-t-[1.4rem] border-b border-magique-trait">
            {e.apercu}
          </div>
          <div className="p-6">
            <h3 className="relief-avant text-xl">{e.titre}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-magique-texteClair">{e.texte}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
