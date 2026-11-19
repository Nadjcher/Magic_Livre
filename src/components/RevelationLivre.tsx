"use client";

/**
 * La révélation : la première fois qu'un parent ouvre le livre terminé (sur
 * cet appareil), une étoile descend, éclate, et la couverture apparaît dans
 * la lumière : « Le livre de Léo est prêt. » Deux boutons : ouvrir le livre,
 * ou revoir la révélation. « Passer » ferme tout de suite.
 *
 * Une seule fois par livre (mémorisé dans le navigateur à la fermeture). Jamais avec le
 * réglage « réduire les animations » : on arrive directement au livre.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gerbe, mouvementReduit } from "@/components/magie/etincelles";

/** 0 : rien ; 1 : l'étoile descend ; 2 : la couverture éclate ; 3 : le titre ; 4 : les boutons. */
type Phase = 0 | 1 | 2 | 3 | 4;

const cle = (bookId: string) => `revele:${bookId}`;

export default function RevelationLivre({ bookId, prenom, titre, couverture }: { bookId: string; prenom: string; titre: string; couverture?: string }) {
  const [ouverte, setOuverte] = useState(false);
  const [phase, setPhase] = useState<Phase>(0);
  const livreRef = useRef<HTMLDivElement>(null);
  const minuteurs = useRef<number[]>([]);

  const jouer = useCallback(() => {
    minuteurs.current.forEach(clearTimeout);
    setPhase(0);
    const plus = (fn: () => void, ms: number) => minuteurs.current.push(window.setTimeout(fn, ms));
    plus(() => setPhase(1), 120);
    plus(() => {
      setPhase(2);
      const r = livreRef.current?.getBoundingClientRect();
      if (!r) return;
      gerbe(r.left + r.width / 2, r.top + r.height / 2, 120, { s: 1.8, big: true });
      plus(() => gerbe(r.left + r.width * 0.1, r.top + r.height * 0.2, 30), 300);
      plus(() => gerbe(r.left + r.width * 0.9, r.top + r.height * 0.3, 30), 500);
    }, 1350);
    plus(() => setPhase(3), 2400);
    plus(() => setPhase(4), 3200);
  }, []);

  useEffect(() => {
    let deja = true;
    try {
      deja = Boolean(localStorage.getItem(cle(bookId)));
    } catch {
      // Stockage indisponible (navigation privée) : on montre la révélation quand même.
      deja = false;
    }
    if (deja || mouvementReduit()) return;
    const debut = window.setTimeout(() => {
      setOuverte(true);
      jouer();
    }, 0);
    const t = minuteurs.current;
    return () => {
      clearTimeout(debut);
      t.forEach(clearTimeout);
    };
  }, [bookId, jouer]);

  const fermer = useCallback(() => {
    minuteurs.current.forEach(clearTimeout);
    setOuverte(false);
    try {
      localStorage.setItem(cle(bookId), "1");
    } catch {
      // Navigation privée : tant pis, elle reviendra à la prochaine ouverture.
    }
  }, [bookId]);

  useEffect(() => {
    if (!ouverte) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    window.addEventListener("keydown", echap);
    const defile = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", echap);
      document.body.style.overflow = defile;
    };
  }, [ouverte, fermer]);

  if (!ouverte) return null;

  // Rendue directement dans <body> : au-dessus de l'en-tête collant.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Le livre de ${prenom} est prêt`} className="revelation fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden px-6 text-center">
      <button type="button" onClick={fermer} className="absolute right-4 top-4 min-h-11 rounded-full px-4 text-sm text-magique-texteClair hover:text-white">
        Passer ✕
      </button>

      <span className="revelation-etoile" aria-hidden="true" style={{ top: phase >= 1 ? "40%" : "-4%", opacity: phase === 1 ? 1 : 0 }} />

      <div
        ref={livreRef}
        className="revelation-livre"
        style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "none" : "perspective(900px) rotateY(-35deg) scale(.55)" }}
      >
        <div className="revelation-rayons" aria-hidden="true" />
        <div className="revelation-halo" aria-hidden="true" />
        <div className="revelation-couverture">
          {couverture ? (
            <img src={couverture} alt={`Couverture : ${titre}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,18,54,.95)] via-[rgba(11,18,54,.1)] to-transparent" />
          <div className="absolute inset-3 rounded-[10px] border border-[rgba(255,217,138,.55)]" />
          <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/45 to-transparent" />
          <p className="titre-dore absolute inset-x-6 bottom-8 text-left font-serif text-2xl leading-tight sm:text-3xl">{titre}</p>
          <span className="reflet-couverture" aria-hidden="true" />
        </div>
      </div>

      <h2
        className="relative mt-10 font-serif text-[clamp(28px,4vw,40px)] text-white transition-all duration-[900ms] ease-[cubic-bezier(.23,1,.32,1)]"
        style={{ opacity: phase >= 3 ? 1 : 0, transform: `translateY(${phase >= 3 ? 0 : 14}px)`, filter: `blur(${phase >= 3 ? 0 : 8}px)` }}
      >
        Le livre de {prenom} est prêt.
      </h2>
      <p className="relative mt-2 max-w-[44ch] text-magique-texteClair transition-opacity delay-300 duration-[900ms]" style={{ opacity: phase >= 3 ? 1 : 0 }}>
        Son visage, son prénom, son histoire. Tournez la page : l'histoire commence.
      </p>
      <div
        className="relative mt-7 flex flex-wrap justify-center gap-3 transition-all duration-700 ease-[cubic-bezier(.23,1,.32,1)]"
        style={{ opacity: phase >= 4 ? 1 : 0, transform: `translateY(${phase >= 4 ? 0 : 12}px)` }}
      >
        <button type="button" onClick={fermer} className="btn-primaire relative overflow-hidden text-lg">
          <span className="revelation-balaie" aria-hidden="true" />
          <span className="relative">Ouvrir le livre</span>
        </button>
        <button type="button" onClick={jouer} className="btn-secondaire">
          Revoir la révélation
        </button>
      </div>
    </div>,
    document.body,
  );
}
