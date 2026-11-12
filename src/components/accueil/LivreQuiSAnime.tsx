/**
 * Le haut de page : Léo ouvre son livre, la lumière monte des pages et six
 * personnages du catalogue en sortent un par un, chacun sur sa trajectoire,
 * puis flottent doucement autour de lui. Une seule sortie (pas de boucle).
 * La photo de l'enfant est épinglée dans un coin : c'est lui, dans son livre.
 * Tout en CSS ; sans animation (préférence système), la scène finale est fixe.
 */

import { LIVRE_VITRINE } from "@/lib/livreVitrine";

/** Point de départ : le cœur du livre ouvert, en % de la scène. */
const LIVRE = { x: 50, y: 84 };

/** Les personnages : position d'arrivée (centre, %), largeur (%), inclinaison, rythme. */
const PERSONNAGES = [
  { nom: "dragon", alt: "Un bébé dragon", x: 14, y: 17, l: 25, r: -8, flotte: 5.2 },
  { nom: "fee", alt: "Une petite fée", x: 87, y: 13, l: 19, r: 6, flotte: 4.6 },
  { nom: "bateau", alt: "Un bateau pirate", x: 12, y: 54, l: 19, r: -4, flotte: 5.8 },
  { nom: "fusee", alt: "Une fusée", x: 90, y: 43, l: 14, r: 12, flotte: 4.2 },
  { nom: "luciole", alt: "Lulu la luciole", x: 18, y: 37, l: 10, r: 0, flotte: 3.6 },
  { nom: "dino", alt: "Un petit dinosaure", x: 9, y: 82, l: 13, r: -6, flotte: 5 },
] as const;

export default function LivreQuiSAnime() {
  return (
    <div className="scene-livre relative mx-auto aspect-square w-[86%] max-w-[560px] sm:w-full">
      {/* La scène peinte, fondue dans la nuit (pas de cadre) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/vitrine/scene.webp"
        alt="Léo ouvre son livre : une lumière dorée monte des pages"
        width={1000}
        height={1000}
        fetchPriority="high"
        className="scene-fond absolute inset-0 h-full w-full object-cover"
      />

      {/* La lumière qui monte du livre */}
      <div className="lumiere-livre" style={{ left: `${LIVRE.x}%`, top: `${LIVRE.y}%` }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[44, 48, 52, 56, 46, 54].map((x, k) => (
          <span key={k} className="poussiere-livre" style={{ left: `${x}%`, top: `${LIVRE.y - 4}%`, animationDelay: `${0.6 + k * 0.7}s` }} />
        ))}
      </div>

      {/* Les personnages qui sortent du livre */}
      {PERSONNAGES.map((p, k) => (
        <span
          key={p.nom}
          className="perso-sortie"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.l}%`,
            ["--dx" as string]: `${LIVRE.x - p.x}cqw`,
            ["--dy" as string]: `${LIVRE.y - p.y}cqw`,
            ["--r" as string]: `${p.r}deg`,
            animationDelay: `${0.9 + k * 0.42}s`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/vitrine/perso-${p.nom}.webp`}
            alt={p.alt}
            className="perso-flotte block h-auto w-full"
            style={{ animationDuration: `${p.flotte}s`, animationDelay: `${3.6 + k * 0.3}s` }}
          />
        </span>
      ))}

      {/* Sa photo, épinglée : c'est bien lui */}
      <figure className="photo-epinglee absolute -bottom-3 right-[3%] w-[24%] rounded-[4px] bg-white p-1.5 pb-6 shadow-conte sm:-bottom-4 sm:p-2 sm:pb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LIVRE_VITRINE.photo} alt="La vraie photo de Léo" className="aspect-[3/4] w-full rounded-[2px] object-cover" />
        <figcaption className="absolute inset-x-0 bottom-1 text-center font-serif text-[11px] italic leading-tight text-nuit sm:bottom-1.5 sm:text-[13px]">
          Sa photo
        </figcaption>
      </figure>
    </div>
  );
}
