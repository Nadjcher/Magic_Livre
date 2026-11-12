"use client";

/**
 * La promesse en une animation : sa photo → son portrait peint (validé par le
 * parent) → son livre. Les trois étapes tournent en boucle ; un clic sur une
 * étiquette la montre. Sans animation (préférence système) : tout reste fixe.
 */

import { useEffect, useState } from "react";
import { LIVRE_VITRINE } from "@/lib/livreVitrine";

const ETAPES = ["Sa photo", "Son portrait", "Son livre"] as const;
const DUREE = 3600;

export default function Metamorphose() {
  const [etape, setEtape] = useState(0);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setEtape((e) => (e + 1) % ETAPES.length), DUREE);
    return () => clearInterval(t);
  }, [pause]);

  const carte = "absolute inset-0 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const visible = (i: number) =>
    etape === i ? "opacity-100 scale-100 rotate-0" : etape > i ? "opacity-0 scale-95 -rotate-3" : "opacity-0 scale-105 rotate-2";

  return (
    <div
      className="relative mx-auto w-full max-w-[440px]"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div className="halo-dore absolute -inset-10 rounded-full" aria-hidden="true" />
      <div className="relative aspect-square">
        {/* 1. La photo, en polaroïd */}
        <figure className={`${carte} ${visible(0)} flex items-center justify-center`}>
          <div className="w-[72%] rotate-[-4deg] rounded-md bg-white p-2.5 pb-10 shadow-conte">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LIVRE_VITRINE.photo} alt="La photo de Léo (enfant fictif)" className="aspect-[4/5] w-full rounded-sm object-cover" />
            <figcaption className="mt-2 text-center font-serif text-base italic text-nuit">La photo de Léo</figcaption>
          </div>
        </figure>

        {/* 2. Le portrait peint, avec la question posée au parent */}
        <figure className={`${carte} ${visible(1)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LIVRE_VITRINE.portrait} alt="Le portrait peint de Léo, dans le style du livre" className="h-full w-full rounded-[2rem] object-cover shadow-conte" />
          {etape === 1 && <div className="balayage-dore absolute inset-0 rounded-[2rem]" aria-hidden="true" />}
          <figcaption className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-2xl bg-nuit/80 px-4 py-3 backdrop-blur">
            <span className="font-serif text-lg text-white">Est-ce bien lui&nbsp;?</span>
            <span className="rounded-full bg-[#ffd98a] px-3 py-1 text-sm font-bold text-nuit">Oui&nbsp;!</span>
          </figcaption>
        </figure>

        {/* 3. Le livre, couverture en relief */}
        <figure className={`${carte} ${visible(2)} [perspective:1400px]`}>
          <div
            className="relative h-full w-full overflow-hidden rounded-l-md rounded-r-[1.6rem] shadow-conte"
            style={{ transform: "rotateY(-12deg) rotateX(3deg)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LIVRE_VITRINE.couverture} alt={`Couverture du livre « ${LIVRE_VITRINE.titre} »`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-y-0 left-0 w-4" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.45),rgba(255,255,255,.12))" }} aria-hidden="true" />
            <figcaption className="absolute inset-x-0 top-0 px-6 pt-6 text-center">
              <p className="font-serif text-[1.7rem] leading-tight text-white [text-shadow:0_2px_12px_rgba(10,16,50,.8)]">{LIVRE_VITRINE.titre}</p>
            </figcaption>
          </div>
        </figure>
      </div>

      {/* Les trois étapes, cliquables */}
      <ol className="relative mt-6 flex justify-center gap-2 text-[13px] sm:text-sm">
        {ETAPES.map((e, i) => (
          <li key={e}>
            <button
              type="button"
              onClick={() => { setEtape(i); setPause(true); }}
              aria-pressed={etape === i}
              className={`min-h-11 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold transition-colors ${
                etape === i ? "bg-[#ffd98a] text-nuit" : "bg-white/10 text-magique-texteClair hover:bg-white/15"
              }`}
            >
              {i + 1}. {e}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
