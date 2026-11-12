/**
 * La promesse d'un coup d'œil : la photo de l'enfant, et à côté la même photo
 * qui se change en héros 3D sous une vague de lumière dorée. Une poussière de
 * lucioles coule de la photo vers le portrait (SVG animé, coupé si l'utilisateur
 * réduit les animations).
 */

import { LIVRE_VITRINE } from "@/lib/livreVitrine";

const CHEMIN = "M6 52 C 30 4, 82 0, 112 30";

function Etoile({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" />
    </svg>
  );
}

export default function Diptyque() {
  return (
    <div className="relative mx-auto grid w-full max-w-[340px] grid-cols-[0.8fr_1fr] items-center gap-3 sm:max-w-[580px] sm:gap-5">
      <div className="halo-dore absolute -inset-10 -z-10 rounded-full" aria-hidden="true" />

      {/* La photo */}
      <figure className="diptyque-photo relative z-10 rounded-md bg-white p-2 pb-8 shadow-conte sm:p-2.5 sm:pb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LIVRE_VITRINE.photo} alt="La photo de Léo" width={600} height={800} className="aspect-[3/4] w-full rounded-sm object-cover" />
        <figcaption className="absolute inset-x-0 bottom-1.5 text-center font-serif text-sm italic text-nuit sm:bottom-2.5 sm:text-base">
          Sa photo
        </figcaption>
      </figure>

      {/* La photo qui devient le héros du livre */}
      <figure className="diptyque-portrait relative">
        <div className="relative aspect-square w-full overflow-hidden rounded-[1.75rem] shadow-conte ring-2 ring-[#ffd98a]/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LIVRE_VITRINE.photo} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LIVRE_VITRINE.portrait}
            alt="Le même enfant, devenu le héros de son livre"
            width={900}
            height={900}
            fetchPriority="high"
            className="revele-magique absolute inset-0 h-full w-full object-cover"
          />
          <span className="front-magique" aria-hidden="true" />
        </div>
        <Etoile className="scintille-coin -right-2 -top-3 h-6 w-6" />
        <Etoile className="scintille-coin -left-3 top-1/3 h-4 w-4" style={{ animationDelay: "0.8s" }} />
        <Etoile className="scintille-coin bottom-10 -right-3 h-5 w-5" style={{ animationDelay: "1.5s" }} />
        <figcaption className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ffd98a] px-4 py-1.5 text-sm font-bold text-nuit shadow-conte">
          Le héros de son livre
        </figcaption>
      </figure>

      {/* Le chemin doré, parcouru par des lucioles */}
      <svg
        className="diptyque-fleche pointer-events-none absolute left-[31%] top-[0%] z-20 h-[24%] w-[32%] overflow-visible text-[#ffd98a]"
        viewBox="0 0 120 60"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="lueur-chemin" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="f" />
            <feMerge><feMergeNode in="f" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path pathLength="1" d={CHEMIN} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.035 0.04" opacity="0.8" />
        <path d="M100 17 L 114 31 L 96 37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <g className="poussiere-chemin" filter="url(#lueur-chemin)">
          {[0, 0.5, 1, 1.5, 2, 2.5].map((d, k) => (
            <circle key={k} r={k % 2 ? 1.6 : 2.4} fill="#fff1c2">
              <animateMotion dur="3s" begin={`${d}s`} repeatCount="indefinite" path={CHEMIN} />
              <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin={`${d}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}
