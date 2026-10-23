/**
 * Illustrations vectorielles de la marque (« Nuit enchantée »).
 *
 * Un jeu cohérent de vignettes SVG, dessinées à la main (pas d'IA), en palette
 * froide et féerique. Avantages sur les anciens .webp : net à toute taille,
 * poids minime, couleurs 100 % maîtrisées (aucun jaune), et cohérence parfaite
 * entre toutes les scènes. Chaque dégradé a un identifiant suffixé par le nom
 * de la scène pour éviter toute collision quand plusieurs coexistent sur une page.
 */

import type { CSSProperties } from "react";

export type SceneName = "hero" | "imagine" | "write" | "together" | "nuit";

// Palette (constantes lisibles, réutilisées dans les dégradés).
// Dominante BLEU NUIT féerique ; violet/rose en étincelles.
const SKY_TOP = "#eef3fe";
const SKY_BOT = "#cfdaf6";
const NIGHT_TOP = "#1b2a66";
const NIGHT_BOT = "#0f1a44";
const VIOLET = "#4f5fe0"; // trait principal (indigo-bleu)
const VIOLET_CLAIR = "#7b86ec";
const ROSE = "#e07cc0";
const ROSE_CLAIR = "#f6b8e0";
const PERVENCHE = "#5b9bff"; // bleu céleste lumineux
const BLANC = "#fdfbff";
const MENTHE = "#7fe0c4";

/** Petite étoile à quatre branches. */
function Etoile({ x, y, r, fill, opacity = 1 }: { x: number; y: number; r: number; fill: string; opacity?: number }) {
  const d = `M${x} ${y - r}C${x + r * 0.18} ${y - r * 0.18} ${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}` +
    `C${x + r * 0.18} ${y + r * 0.18} ${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}` +
    `C${x - r * 0.18} ${y + r * 0.18} ${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}` +
    `C${x - r * 0.18} ${y - r * 0.18} ${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;
  return <path d={d} fill={fill} opacity={opacity} />;
}

function Cadre({ id, nuit = false }: { id: string; nuit?: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={nuit ? NIGHT_TOP : SKY_TOP} />
          <stop offset="1" stopColor={nuit ? NIGHT_BOT : SKY_BOT} />
        </linearGradient>
        <linearGradient id={`glow-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ROSE_CLAIR} />
          <stop offset="1" stopColor={VIOLET} />
        </linearGradient>
        <radialGradient id={`halo-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={nuit ? PERVENCHE : ROSE_CLAIR} stopOpacity="0.6" />
          <stop offset="1" stopColor={nuit ? PERVENCHE : ROSE_CLAIR} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="300" rx="30" fill={`url(#sky-${id})`} />
    </>
  );
}

/** Lune en croissant (accent récurrent de la marque). */
function Lune({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={BLANC} />
      <circle cx={x + r * 0.5} cy={y - r * 0.2} r={r * 0.92} fill="#e4ecfb" />
    </g>
  );
}

function Hero({ id }: { id: string }) {
  return (
    <>
      <Cadre id={id} />
      <circle cx="200" cy="160" r="110" fill={`url(#halo-${id})`} />
      <Lune x={318} y={70} r={22} />
      <Etoile x={70} y={60} r={9} fill={ROSE} />
      <Etoile x={110} y={110} r={5} fill={VIOLET_CLAIR} />
      <Etoile x={330} y={150} r={6} fill={PERVENCHE} />
      <Etoile x={60} y={180} r={5} fill={ROSE_CLAIR} />
      {/* étincelles qui montent du livre */}
      <Etoile x={175} y={90} r={5} fill={ROSE} opacity={0.9} />
      <Etoile x={225} y={78} r={6} fill={VIOLET_CLAIR} />
      <Etoile x={205} y={110} r={4} fill={MENTHE} />
      {/* livre ouvert lumineux */}
      <g transform="translate(200 205)">
        <ellipse cx="0" cy="18" rx="150" ry="22" fill={VIOLET} opacity="0.12" />
        <path d="M0 -8C-34 -30 -92 -30 -126 -14L-126 58C-92 42 -34 42 0 64Z" fill={BLANC} stroke={VIOLET} strokeWidth="3" strokeLinejoin="round" />
        <path d="M0 -8C34 -30 92 -30 126 -14L126 58C92 42 34 42 0 64Z" fill={BLANC} stroke={VIOLET} strokeWidth="3" strokeLinejoin="round" />
        <path d="M0 -8L0 64" stroke={VIOLET} strokeWidth="3" />
        <path d="M-108 2C-80 -8 -40 -8 -14 4M-108 20C-80 10 -40 10 -14 22M-108 38C-80 28 -40 28 -14 40" stroke={ROSE} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
        <path d="M108 2C80 -8 40 -8 14 4M108 20C80 10 40 10 14 22M108 38C80 28 40 28 14 40" stroke={PERVENCHE} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      </g>
    </>
  );
}

function Imagine({ id }: { id: string }) {
  return (
    <>
      <Cadre id={id} />
      <circle cx="250" cy="120" r="95" fill={`url(#halo-${id})`} />
      <Etoile x={70} y={70} r={8} fill={ROSE} />
      <Etoile x={330} y={60} r={6} fill={VIOLET_CLAIR} />
      <Etoile x={320} y={210} r={5} fill={PERVENCHE} />
      {/* enfant de profil (rond, tendre) */}
      <g transform="translate(120 170)">
        <circle cx="0" cy="0" r="46" fill={VIOLET_CLAIR} />
        <circle cx="0" cy="0" r="46" fill="none" stroke={VIOLET} strokeWidth="3" />
        <circle cx="16" cy="-4" r="4.5" fill={NIGHT_TOP} />
        <path d="M6 16C14 22 26 22 34 16" stroke={NIGHT_TOP} strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="30" cy="10" r="7" fill={ROSE_CLAIR} opacity="0.7" />
      </g>
      {/* bulle d'imagination : nuage de pensée + château-étoile */}
      <g transform="translate(250 110)">
        <circle cx="-54" cy="46" r="7" fill={BLANC} />
        <circle cx="-40" cy="60" r="10" fill={BLANC} />
        <path d="M-70 10C-70 -22 -40 -36 -6 -32C14 -52 60 -44 58 -14C84 -10 82 26 50 28L-44 28C-70 28 -78 6 -70 10Z" fill={BLANC} />
        <path d="M-20 18L-20 -8L-6 -20L8 -8L8 18Z" fill={`url(#glow-${id})`} />
        <path d="M-20 18L-20 -8L-6 -20L8 -8L8 18Z" fill="none" stroke={VIOLET} strokeWidth="2" />
        <Etoile x={-6} y={-2} r={6} fill={BLANC} />
        <rect x="-15" y="4" width="7" height="14" rx="2" fill={BLANC} opacity="0.8" />
      </g>
    </>
  );
}

function Write({ id }: { id: string }) {
  return (
    <>
      <Cadre id={id} />
      <circle cx="210" cy="160" r="100" fill={`url(#halo-${id})`} />
      <Etoile x={80} y={70} r={7} fill={ROSE} />
      <Etoile x={320} y={90} r={6} fill={VIOLET_CLAIR} />
      <Etoile x={300} y={220} r={5} fill={MENTHE} />
      {/* parchemin */}
      <g transform="translate(200 185)">
        <rect x="-120" y="-70" width="240" height="150" rx="14" fill={BLANC} stroke={VIOLET} strokeWidth="3" />
        {/* traînée d'écriture en étincelles */}
        <path d="M-96 -34C-70 -46 -40 -22 -14 -34C12 -46 40 -22 66 -34" stroke={ROSE} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
        <path d="M-96 -6C-70 -18 -40 6 -14 -6C12 -18 40 6 66 -6" stroke={PERVENCHE} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />
        <path d="M-96 22C-74 12 -48 30 -24 22" stroke={VIOLET_CLAIR} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        <Etoile x={92} y={-6} r={6} fill={ROSE} />
      </g>
      {/* plume */}
      <g transform="translate(250 90) rotate(32)">
        <path d="M0 0C40 -6 70 -40 86 -86C40 -74 10 -44 0 0Z" fill={`url(#glow-${id})`} />
        <path d="M0 0C40 -6 70 -40 86 -86" stroke={VIOLET} strokeWidth="2.5" fill="none" />
        <path d="M10 -10C34 -18 54 -40 70 -70" stroke={BLANC} strokeWidth="2" fill="none" opacity="0.7" />
        <rect x="-10" y="-2" width="16" height="6" rx="3" fill={VIOLET} transform="rotate(20)" />
      </g>
    </>
  );
}

function Together({ id }: { id: string }) {
  return (
    <>
      <Cadre id={id} />
      <circle cx="200" cy="170" r="110" fill={`url(#halo-${id})`} />
      <Lune x={330} y={64} r={18} />
      <Etoile x={70} y={70} r={8} fill={ROSE} />
      <Etoile x={120} y={50} r={5} fill={VIOLET_CLAIR} />
      <Etoile x={64} y={150} r={5} fill={PERVENCHE} />
      {/* deux personnages câlins */}
      <g transform="translate(200 200)">
        <ellipse cx="0" cy="70" rx="150" ry="20" fill={VIOLET} opacity="0.1" />
        {/* adulte */}
        <path d="M-96 70L-96 6C-96 -22 -72 -40 -44 -40C-16 -40 4 -22 4 6L4 70Z" fill={VIOLET} />
        <circle cx="-46" cy="-56" r="26" fill={VIOLET_CLAIR} stroke={VIOLET} strokeWidth="3" />
        {/* enfant */}
        <path d="M-6 70L-6 18C-6 -2 10 -16 30 -16C50 -16 64 -2 64 18L64 70Z" fill={ROSE} />
        <circle cx="29" cy="-30" r="20" fill={ROSE_CLAIR} stroke={ROSE} strokeWidth="3" />
        {/* livre partagé */}
        <g transform="translate(-14 30)">
          <path d="M0 -4C-20 -16 -44 -16 -64 -6L-64 34C-44 24 -20 24 0 36Z" fill={BLANC} stroke={VIOLET} strokeWidth="2.5" />
          <path d="M0 -4C20 -16 44 -16 64 -6L64 34C44 24 20 24 0 36Z" fill={BLANC} stroke={VIOLET} strokeWidth="2.5" />
        </g>
      </g>
    </>
  );
}

function Nuit({ id }: { id: string }) {
  return (
    <>
      <Cadre id={id} nuit />
      <circle cx="120" cy="110" r="110" fill={`url(#halo-${id})`} />
      <Lune x={118} y={96} r={40} />
      <Etoile x={250} y={60} r={9} fill={BLANC} />
      <Etoile x={300} y={110} r={6} fill={ROSE_CLAIR} />
      <Etoile x={330} y={190} r={5} fill={PERVENCHE} />
      <Etoile x={210} y={120} r={4} fill={BLANC} opacity={0.8} />
      <Etoile x={60} y={210} r={5} fill={ROSE_CLAIR} />
      {/* petit lit + enfant endormi */}
      <g transform="translate(205 235)">
        <ellipse cx="0" cy="34" rx="170" ry="16" fill="#000" opacity="0.15" />
        <rect x="-150" y="-10" width="300" height="44" rx="14" fill={VIOLET} />
        <rect x="-150" y="6" width="300" height="28" rx="12" fill={VIOLET_CLAIR} />
        {/* oreiller + tête */}
        <rect x="-150" y="-26" width="70" height="36" rx="14" fill={BLANC} opacity="0.9" />
        <circle cx="-116" cy="-18" r="16" fill={ROSE_CLAIR} />
        {/* couverture */}
        <path d="M-96 10C-40 -14 60 -14 150 10L150 34L-96 34Z" fill={ROSE} opacity="0.9" />
        <path d="M-96 10C-40 -14 60 -14 150 10" stroke={BLANC} strokeWidth="2.5" fill="none" opacity="0.6" />
      </g>
    </>
  );
}

const SCENES: Record<SceneName, (p: { id: string }) => JSX.Element> = {
  hero: Hero,
  imagine: Imagine,
  write: Write,
  together: Together,
  nuit: Nuit,
};

/**
 * Rend une scène de la marque. `alt` vide => décoratif (aria-hidden).
 */
export function SceneIllustration({
  name,
  alt = "",
  className = "",
  style,
}: {
  name: SceneName;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Scene = SCENES[name];
  const decorative = alt.length === 0;
  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : alt}
      preserveAspectRatio="xMidYMid meet"
    >
      {!decorative && <title>{alt}</title>}
      <Scene id={name} />
    </svg>
  );
}
