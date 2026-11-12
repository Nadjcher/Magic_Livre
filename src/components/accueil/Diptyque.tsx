/**
 * La promesse d'un coup d'œil : la photo de l'enfant, et à côté son portrait
 * dans le livre. Un seul moment animé au chargement (la photo se pose, la
 * flèche dorée se trace, le portrait éclot) ; ensuite tout reste immobile.
 */

import { LIVRE_VITRINE } from "@/lib/livreVitrine";

export default function Diptyque() {
  return (
    <div className="relative mx-auto grid w-full max-w-[330px] sm:max-w-[560px] grid-cols-[0.8fr_1fr] items-center gap-3 sm:gap-5">
      <div className="halo-dore absolute -inset-8 -z-10 rounded-full" aria-hidden="true" />

      {/* La photo */}
      <figure className="diptyque-photo relative z-10 rounded-md bg-white p-2 pb-8 shadow-conte sm:p-2.5 sm:pb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LIVRE_VITRINE.photo} alt="La photo de Léo" width={600} height={800} className="aspect-[3/4] w-full rounded-sm object-cover" />
        <figcaption className="absolute inset-x-0 bottom-1.5 text-center font-serif text-sm italic text-nuit sm:bottom-2.5 sm:text-base">
          Sa photo
        </figcaption>
      </figure>

      {/* Le portrait du livre */}
      <figure className="diptyque-portrait relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LIVRE_VITRINE.portrait}
          alt="Le même enfant, dessiné en héros de son livre"
          width={900}
          height={900}
          fetchPriority="high"
          className="aspect-square w-full rounded-[1.75rem] object-cover shadow-conte ring-2 ring-[#ffd98a]/60"
        />
        <figcaption className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ffd98a] px-4 py-1.5 text-sm font-bold text-nuit shadow-conte">
          Le héros de son livre
        </figcaption>
      </figure>

      {/* La flèche dorée qui relie les deux */}
      <svg
        className="diptyque-fleche pointer-events-none absolute left-[33%] top-[2%] z-20 h-[22%] w-[30%] text-[#ffd98a]"
        viewBox="0 0 120 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path pathLength="1" d="M6 48 C 30 6, 80 2, 108 26" strokeDasharray="0.04 0.035" />
        <path pathLength="1" d="M96 14 L 110 28 L 92 34" />
      </svg>
    </div>
  );
}
