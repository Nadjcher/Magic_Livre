"use client";

/**
 * Le livre de Léo qui se feuillette tout seul : l'image à gauche, le texte à
 * droite, comme un album ouvert. Il démarre quand il entre à l'écran, s'arrête
 * au survol ou au clavier, et laisse la main (flèches, points). Remplace la vidéo :
 * le parent voit le vrai produit, page après page.
 */

import { useEffect, useRef, useState } from "react";
import { LIVRE_VITRINE } from "@/lib/livreVitrine";

const DUREE = 6500;

function Texte({ texte }: { texte: string }) {
  // Le prénom en doré : on voit tout de suite que l'histoire est la sienne.
  const morceaux = texte.split(/(Léo)/);
  return (
    <>
      {morceaux.map((m, i) =>
        m === "Léo" ? (
          <strong key={i} className="font-semibold text-[#b5651d]">Léo</strong>
        ) : (
          <span key={i}>{m}</span>
        ),
      )}
    </>
  );
}

export default function LivreVitrine() {
  const pages = LIVRE_VITRINE.pages;
  const [i, setI] = useState(0);
  const [precedente, setPrecedente] = useState<number | null>(null);
  const [actif, setActif] = useState(false);
  const [pause, setPause] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  const aller = (n: number) => {
    setPrecedente(i);
    setI((n + pages.length) % pages.length);
  };

  // Démarre seulement quand le livre est à l'écran.
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActif(Boolean(e?.isIntersecting)), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!actif || pause || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      setPrecedente(i);
      setI((x) => (x + 1) % pages.length);
    }, DUREE);
    return () => clearTimeout(t);
  }, [actif, pause, i, pages.length]);

  const page = pages[i]!;
  const ancienne = precedente !== null ? pages[precedente] : null;

  return (
    <div
      ref={boite}
      className="relative"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onFocus={() => setPause(true)}
      onBlur={() => setPause(false)}
    >
      <div className="relative grid overflow-hidden rounded-[1.75rem] bg-[#f6ecd8] shadow-conte md:grid-cols-2">
        {/* Page de gauche : l'illustration */}
        <div className="relative aspect-square overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={page.image} src={page.image} alt={page.alt} className="anim-fade absolute inset-0 h-full w-full object-cover" />
          {ancienne && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`old-${ancienne.image}-${i}`}
              src={ancienne.image}
              alt=""
              aria-hidden="true"
              className="page-tourne absolute inset-0 h-full w-full object-cover"
              onAnimationEnd={() => setPrecedente(null)}
            />
          )}
        </div>
        {/* Pli central */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/15 to-transparent md:block" aria-hidden="true" />
        {/* Page de droite : le texte, à lire à voix haute */}
        <div className="flex flex-col justify-between gap-5 p-6 text-[#2a2140] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a6a3a]">
            {LIVRE_VITRINE.titre} · page {i + 1}
          </p>
          <p key={i} className="texte-apparait min-h-[9.5em] font-serif text-[1.2rem] leading-relaxed sm:min-h-0 sm:text-2xl" aria-live="polite">
            <Texte texte={page.texte} />
          </p>
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => aller(i - 1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2a2140]/10 text-xl hover:bg-[#2a2140]/20" aria-label="Page précédente">
              ‹
            </button>
            <div className="flex gap-2" role="tablist" aria-label="Pages du livre">
              {pages.map((_, k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={k === i}
                  aria-label={`Page ${k + 1}`}
                  onClick={() => aller(k)}
                  className="flex h-11 w-5 items-center justify-center"
                >
                  <span className={`block h-2 rounded-full transition-all ${k === i ? "w-5 bg-[#b5651d]" : "w-2 bg-[#2a2140]/25"}`} />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => aller(i + 1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2a2140]/10 text-xl hover:bg-[#2a2140]/20" aria-label="Page suivante">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
