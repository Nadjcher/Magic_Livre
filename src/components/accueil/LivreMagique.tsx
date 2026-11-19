"use client";

/**
 * Le livre de Léo, en objet : fermé, il montre sa couverture ; quand il arrive
 * à l'écran, il s'ouvre dans une gerbe d'étincelles dorées, puis ses pages se
 * tournent en relief (image à gauche, texte à droite). Sur téléphone : une page
 * à la fois (image et texte), même geste. Clic à droite = page suivante, à
 * gauche = précédente. À chaque page : un rideau d'étincelles le long de la
 * reliure, le texte qui s'écrit à l'encre mot à mot, l'image qui avance
 * doucement. Sans animation (préférence système) : rien de tout ça, et pas
 * d'autolecture.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LIVRE_VITRINE } from "@/lib/livreVitrine";
import { gerbe, ligne } from "@/components/magie/etincelles";

const PAGES = LIVRE_VITRINE.pages;
const DUREE = 6000;

const POUSSIERE = [8, 22, 35, 48, 61, 74, 87, 15, 55, 80];

/** Le texte, mot à mot : sur la page ouverte, chaque mot s'écrit à l'encre (globals.css, .mot-encre). */
function Texte({ texte }: { texte: string }) {
  let j = 0;
  return (
    <>
      {texte.split(/(\s+)/).map((m, i) =>
        !m || /^\s+$/.test(m) ? (
          m
        ) : (
          <span key={i} className="mot-encre" style={{ ["--j" as string]: j++ }}>
            {m.split(/(Léo)/).map((x, k) =>
              x === "Léo" ? (
                <strong key={k} className="font-semibold text-[#a4561a]">Léo</strong>
              ) : (
                x
              ),
            )}
          </span>
        ),
      )}
    </>
  );
}

function Couverture() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-r-[14px] rounded-l-[4px] bg-[#13204f]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LIVRE_VITRINE.couverture} alt={`Couverture : ${LIVRE_VITRINE.titre}`} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1236]/95 via-[#0b1236]/10 to-transparent" />
      {/* filet doré façon dorure à chaud */}
      <div className="absolute inset-3 rounded-[10px] border border-[#ffd98a]/55" aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/45 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-6 bottom-6 text-center sm:bottom-8">
        <p className="titre-dore font-serif text-[1.65rem] leading-[1.1] sm:text-[2.1rem]">{LIVRE_VITRINE.titre}</p>
        <p className="mt-2 text-xs text-[#f6e7c4]/85 sm:text-sm">Une histoire écrite pour Léo, 4 ans</p>
      </div>
      <span className="reflet-couverture" aria-hidden="true" />
    </div>
  );
}

function PageTexte({ n, texte }: { n: number; texte: string }) {
  return (
    <div className="papier absolute inset-0 flex flex-col justify-center px-[9%] py-[8%] text-[#2a2140]">
      <p className="lettrine font-serif text-[clamp(0.95rem,1.55vw,1.4rem)] leading-[1.55]">
        <Texte texte={texte} />
      </p>
      <span className="absolute inset-x-0 bottom-[5%] text-center font-serif text-xs text-[#8a6a3a]">{n}</span>
    </div>
  );
}

function PageImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#13204f]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="zoom-lent absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent" aria-hidden="true" />
    </div>
  );
}

function Fin() {
  return (
    <div className="papier absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-[#2a2140]">
      <p className="font-serif text-3xl italic">Fin</p>
      <p className="font-serif text-sm text-[#8a6a3a]">… à demain, petite lueur.</p>
    </div>
  );
}

function Appel({ href, prix }: { href: string; prix: string }) {
  return (
    <div className="papier absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-[#2a2140]">
      <p className="font-serif text-[clamp(1.2rem,2vw,1.7rem)] leading-snug">Et ce soir, le livre de votre enfant&nbsp;?</p>
      <p className="text-sm text-[#5b4a6b]">Lu en entier gratuitement, gardé pour {prix}.</p>
      <a href={href} className="btn-primaire whitespace-nowrap text-[15px]" onClick={(e) => e.stopPropagation()}>
        Créer son livre gratuitement
      </a>
    </div>
  );
}

type Feuille = { recto: ReactNode; verso: ReactNode };

export default function LivreMagique({ href, prix }: { href: string; prix: string }) {
  const [etroit, setEtroit] = useState(true);
  const [tourne, setTourne] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pause, setPause] = useState(false);
  const [gouttiere, setGouttiere] = useState(false);
  const [calme, setCalme] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const livre = useRef<HTMLDivElement>(null);
  const tourneRef = useRef(0);
  const minuteurs = useRef<number[]>([]);
  useEffect(() => () => minuteurs.current.forEach(clearTimeout), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const maj = () => setEtroit(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    setCalme(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => mq.removeEventListener("change", maj);
  }, []);

  // Livre à double page (ordinateur) ou page par page (téléphone).
  const feuilles: Feuille[] = etroit
    ? [
        { recto: <Couverture />, verso: <div className="papier absolute inset-0" /> },
        ...PAGES.map((p, k) => ({
          recto: (
            <div className="papier absolute inset-0 flex flex-col">
              <div className="relative aspect-square w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.alt} loading="lazy" className="zoom-lent absolute inset-0 h-full w-full object-cover" />
              </div>
              <p className="lettrine flex-1 px-5 pb-6 pt-4 font-serif text-[1.02rem] leading-[1.5] text-[#2a2140]">
                <Texte texte={p.texte} />
              </p>
              <span className="absolute inset-x-0 bottom-2 text-center font-serif text-xs text-[#8a6a3a]">{k + 1}</span>
            </div>
          ),
          verso: <div className="papier absolute inset-0" />,
        })),
      ]
    : [
        { recto: <Couverture />, verso: <PageImage src={PAGES[0]!.image} alt={PAGES[0]!.alt} /> },
        ...PAGES.map((p, k) => ({
          recto: <PageTexte n={k + 1} texte={p.texte} />,
          verso: k + 1 < PAGES.length ? <PageImage src={PAGES[k + 1]!.image} alt={PAGES[k + 1]!.alt} /> : <Fin />,
        })),
      ];
  const N = feuilles.length;

  const aller = useCallback(
    (n: number) => {
      const cible = Math.max(0, Math.min(N, n));
      const avant = tourneRef.current;
      if (cible === avant) return;
      tourneRef.current = cible;
      setTourne(cible);
      if (calme) return;
      const plus = (fn: () => void, ms: number) => minuteurs.current.push(window.setTimeout(fn, ms));
      // Positions lues au moment de l'effet (la page peut encore défiler, le livre glisser en s'ouvrant).
      if (avant === 0) {
        // Le livre s'ouvre : une gerbe d'étincelles jaillit des pages, au centre de la scène.
        plus(() => {
          const sc = scene.current?.getBoundingClientRect();
          const r = livre.current?.getBoundingClientRect();
          if (sc && r) gerbe(sc.left + sc.width / 2, r.top + r.height * 0.45, 70, { s: 1.4, big: true });
        }, 300);
      } else if (cible > 0) {
        // Une page tourne : rideau d'étincelles le long de la reliure, et la gouttière s'illumine.
        plus(() => {
          const r = livre.current?.getBoundingClientRect();
          if (r) ligne(etroit ? r.left : r.left + r.width / 2, r.top + 10, r.bottom - 10, 40, etroit ? 1 : -1);
        }, 450);
      }
      setGouttiere(true);
      plus(() => setGouttiere(false), 900);
    },
    [N, calme, etroit],
  );

  // Ouverture quand le livre est bien à l'écran.
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.55 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || pause || calme) return;
    const attente = tourne === 0 ? 900 : tourne >= N ? 7000 : DUREE;
    const t = setTimeout(() => aller(tourne >= N ? 0 : tourne + 1), attente);
    return () => clearTimeout(t);
  }, [visible, pause, calme, tourne, N, aller]);

  const ouvert = tourne > 0;
  const clic = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const droite = etroit ? e.clientX - r.left > r.width * 0.35 : e.clientX - r.left > r.width / 2;
    setPause(true);
    aller(droite ? tourne + 1 : tourne - 1);
  };

  return (
    <div className="relative">
      <div
        ref={scene}
        className="livre-scene relative mx-auto"
        onMouseEnter={() => setPause(true)}
        onMouseLeave={() => setPause(false)}
      >
        {/* Lueur sous le livre */}
        <div className={`livre-lueur ${ouvert ? "opacity-100" : "opacity-60"}`} aria-hidden="true" />

        <div
          ref={livre}
          className={`livre ${etroit ? "livre-simple" : "livre-double"} ${ouvert ? "est-ouvert" : ""}`}
          onClick={clic}
          role="group"
          aria-roledescription="livre"
          aria-label={`${LIVRE_VITRINE.titre}, ${ouvert ? `page ${Math.min(tourne, PAGES.length)} sur ${PAGES.length}` : "fermé"}`}
        >
          {/* Socle : à gauche la garde, à droite l'appel final (sous toutes les feuilles) */}
          {!etroit && <div className="livre-gauche papier" aria-hidden="true" />}
          <div className="livre-droite">
            {/* Rendu seulement à la fin : sinon le bouton transparaît à travers les feuilles. */}
            {tourne >= N ? <Appel href={href} prix={prix} /> : <div className="papier absolute inset-0" />}
          </div>
          {/* Lueur dorée dans la gouttière, le temps d'un tourne-page */}
          {!calme && <div className={`livre-gouttiere ${gouttiere && ouvert ? "allumee" : ""}`} aria-hidden="true" />}
          {/* Tranche des pages, visible livre fermé */}
          <div className="livre-tranche" aria-hidden="true" />

          {feuilles.map((f, i) => {
            const estTournee = i < tourne;
            return (
              <div
                key={i}
                className={`feuille ${estTournee ? "tournee" : ""} ${i === tourne ? "active" : ""} ${i === tourne - 1 ? "gauche" : ""}`}
                style={{ zIndex: estTournee ? i + 1 : N - i + 1 }}
                aria-hidden={i !== tourne && i !== tourne - 1}
              >
                <div className="face recto">{f.recto}</div>
                <div className="face verso">{f.verso}</div>
              </div>
            );
          })}
        </div>

        {/* Poussière dorée tant qu'il est ouvert */}
        {!calme && (
          <div className="pointer-events-none absolute inset-0 z-40" aria-hidden="true">
            {ouvert &&
              POUSSIERE.map((x, k) => (
                <span key={`p${k}`} className="poussiere" style={{ left: `${x}%`, animationDelay: `${k * 0.45}s` }} />
              ))}
          </div>
        )}
      </div>

      {/* Commandes */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => { setPause(true); aller(tourne - 1); }} disabled={tourne === 0} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 disabled:opacity-30" aria-label="Page précédente">
          ‹
        </button>
        <button type="button" onClick={() => { setPause(true); aller(ouvert ? 0 : 1); }} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-[#ffd98a] hover:underline">
          {ouvert ? "Refermer le livre" : "Ouvrir le livre"}
        </button>
        <button type="button" onClick={() => { setPause(true); aller(tourne + 1); }} disabled={tourne >= N} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 disabled:opacity-30" aria-label="Page suivante">
          ›
        </button>
      </div>
    </div>
  );
}
