"use client";

/**
 * Le haut de page : la chambre est dans le noir, un cœur de lumière s'allume
 * dans le livre de Léo, une onde dorée éclaire la pièce, puis six personnages
 * du catalogue jaillissent du livre un par un, sur des courbes, et flottent
 * autour de lui. Sa photo s'épingle ensuite dans un coin.
 *
 * Une seule horloge (requestAnimationFrame) écrit les styles à chaque image,
 * sans re-rendu React ; elle ne tourne que quand la scène est à l'écran.
 * « Réduire les animations » (réglage du téléphone) : la scène finale, fixe,
 * sans étincelles (les styles de base de globals.css).
 */

import { useCallback, useEffect, useRef } from "react";
import { LIVRE_VITRINE } from "@/lib/livreVitrine";
import { etincelle, gerbe, mouvementReduit, vol } from "@/components/magie/etincelles";

/** Le cœur du livre ouvert, en % de la scène. */
const LIVRE = { x: 50, y: 82 };

/** Les personnages : arrivée (centre, %), largeur (%), inclinaison, période de flottement (s), profondeur de parallaxe (px). */
const PERSONNAGES = [
  { nom: "dragon", alt: "Un bébé dragon", x: 14, y: 17, l: 25, r: -8, f: 5.2, d: 18 },
  { nom: "fee", alt: "Une petite fée", x: 87, y: 13, l: 19, r: 6, f: 4.6, d: 26 },
  { nom: "bateau", alt: "Un bateau pirate", x: 12, y: 54, l: 19, r: -4, f: 5.8, d: 12 },
  { nom: "fusee", alt: "Une fusée", x: 90, y: 43, l: 14, r: 12, f: 4.2, d: 22 },
  { nom: "luciole", alt: "Lulu la luciole", x: 18, y: 37, l: 10, r: 0, f: 3.6, d: 34 },
  { nom: "dino", alt: "Un petit dinosaure", x: 9, y: 82, l: 13, r: -6, f: 5, d: 10 },
] as const;

const cl = (v: number) => Math.max(0, Math.min(1, v));
const eo = (u: number) => 1 - Math.pow(1 - u, 3);
const io = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const back = (u: number) => 1 + 2.9 * Math.pow(u - 1, 3) + 1.9 * Math.pow(u - 1, 2);

/** Relance les animations CSS du titre (mot à mot). */
function rejouerTitre() {
  document.querySelectorAll<HTMLElement>("[data-titre-magie] *").forEach((n) => {
    const a = getComputedStyle(n).animationName;
    if (!a || a === "none") return;
    n.style.animation = "none";
    void n.offsetWidth;
    n.style.animation = "";
  });
}

export default function LivreQuiSAnime() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const t0 = useRef(0);
  const faits = useRef<Record<string, boolean>>({});

  const rejouer = useCallback(() => {
    t0.current = performance.now() + 60;
    faits.current = {};
    rejouerTitre();
  }, []);

  useEffect(() => {
    const sc = sceneRef.current;
    if (!sc || mouvementReduit()) return;
    const q = (s: string) => sc.querySelector<HTMLElement>(`[data-h="${s}"]`);
    const el = {
      core: q("core"), flash: q("flash"), rays: q("rays"), lum: q("lum"), voile: q("voile"), img: q("img"), photo: q("photo"),
      ring0: q("ring0"), ring1: q("ring1"),
      persos: PERSONNAGES.map((_, i) => sc.querySelector<HTMLElement>(`[data-perso="${i}"]`)),
    };
    const set = (e: HTMLElement | null, o: number, tr?: string) => {
      if (!e) return;
      e.style.opacity = String(o);
      if (tr != null) e.style.transform = tr;
    };

    let raf = 0;
    let visible = true;
    t0.current = performance.now();

    const image = (now: number) => {
      raf = 0;
      const t = (now - t0.current) / 1000;
      if (t >= -0.1) {
        const seg = (a: number, b: number) => cl((t - a) / (b - a));
        const hf = faits.current;
        const R = sc.getBoundingClientRect();
        const bx = R.left + R.width * 0.5;
        const by = R.top + R.height * 0.82;

        // 1. Le cœur de lumière s'allume dans le livre.
        const cu = eo(seg(0.15, 0.75));
        set(el.core, cu * (1 - 0.45 * seg(2, 3)), `translate(-50%,-50%) scale(${0.15 + cu + 0.06 * Math.sin(t * 3.2)})`);
        // 2. Deux ondes de choc et un éclair.
        [el.ring0, el.ring1].forEach((r, i) => {
          const u = seg(0.6 + i * 0.28, 1.9 + i * 0.28);
          set(r, u > 0 && u < 1 ? (1 - u) * 0.9 : 0, `translate(-50%,-50%) scale(${0.08 + eo(u) * 3.4})`);
        });
        set(el.flash, Math.sin(seg(0.55, 1.35) * Math.PI) * 0.7);
        if (!hf.choc && t > 0.62) {
          hf.choc = true;
          for (let i = 0; i < 60; i++) {
            const a = (i / 60) * 6.283;
            etincelle(bx, by, { vx: Math.cos(a) * 7, vy: Math.sin(a) * 4.5, life: 38, r: 1.2 + Math.random() * 1.6, g: 0, star: i % 4 === 0 });
          }
        }
        // 3. Les rayons s'ouvrent en éventail.
        const ru = eo(seg(0.85, 2.4));
        set(el.rays, ru, `translate(-50%,-50%) rotate(${t * 5}deg) scale(${0.3 + 0.7 * ru})`);
        const lu = eo(seg(0.5, 1.8));
        set(el.lum, lu * (0.85 + 0.15 * Math.sin(t * 2)), `translate(-50%,-62%) scale(${0.3 + 0.7 * lu})`);
        // 4. La lumière révèle la chambre depuis le livre.
        const rv = io(seg(0.8, 2.6));
        sc.style.setProperty("--rev", `${rv * 130}%`);
        set(el.voile, 1 - seg(2.4, 2.8));
        if (el.img) el.img.style.filter = `brightness(${0.4 + 0.6 * rv}) saturate(${0.6 + 0.4 * rv})`;
        // 5. Un tourbillon de poussière d'or monte du livre.
        if (t > 1 && t < 4.4) {
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * 6.283;
            etincelle(bx + Math.cos(a) * 20, by, {
              vx: Math.cos(a) * 1.6, vy: -2.4 - Math.random() * 2.6, curl: (Math.random() < 0.5 ? -1 : 1) * (0.03 + Math.random() * 0.03),
              g: -0.012, life: 60 + Math.random() * 40, r: 0.9 + Math.random() * 1.8, star: Math.random() < 0.3,
            });
          }
        }
        // 6. Les héros jaillissent un par un, sur des courbes.
        PERSONNAGES.forEach((p, i) => {
          const e = el.persos[i];
          if (!e) return;
          const st = 1.55 + i * 0.34;
          const u = seg(st, st + 1.3);
          const ee = eo(u);
          const cx = (LIVRE.x + p.x) / 2 + (p.x < 50 ? -10 : 10);
          const cy = Math.min(LIVRE.y, p.y) - 26;
          const x = (1 - ee) * (1 - ee) * LIVRE.x + 2 * (1 - ee) * ee * cx + ee * ee * p.x;
          const y = (1 - ee) * (1 - ee) * LIVRE.y + 2 * (1 - ee) * ee * cy + ee * ee * p.y;
          const pose = t - (st + 1.3);
          const fl = pose > 0 ? Math.sin((pose * 6.283) / p.f) * 1.6 * cl(pose * 2) : 0;
          const sq = pose > 0 && pose < 0.5 ? Math.sin((pose / 0.5) * Math.PI) * 0.08 : 0;
          const s = u <= 0 ? 0 : 0.12 + 0.88 * back(u);
          const rot = p.r + (1 - ee) * (p.x < 50 ? -50 : 50) + (pose > 0 ? Math.sin(t * 1.1 + i) * 2.5 : 0);
          e.style.left = `${x}%`;
          e.style.top = `${y + fl}%`;
          e.style.opacity = String(cl(u * 5));
          e.style.transform = `translate(-50%,-50%) scale(${s * (1 + sq)}, ${s * (1 - sq)}) rotate(${rot}deg)`;
          if (u > 0 && u < 1) {
            const r = e.getBoundingClientRect();
            for (let j = 0; j < 3; j++) {
              etincelle(r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 0.3, r.top + r.height / 2 + (Math.random() - 0.5) * r.height * 0.3, {
                vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4 + 0.3, life: 40 + Math.random() * 25, r: 0.8 + Math.random() * 2, g: 0.015, star: Math.random() < 0.3,
              });
            }
          }
          if (!hf[`p${i}`] && u >= 1) {
            hf[`p${i}`] = true;
            const r = e.getBoundingClientRect();
            gerbe(r.left + r.width / 2, r.top + r.height / 2, 26, { s: 0.8 });
            etincelle(r.left + r.width / 2, r.top + r.height / 2, { life: 26, r: 9, g: 0, star: true, col: "#fff1c2" });
          }
        });
        // 7. Sa photo s'épingle, et un fil d'étoiles la relie au héros dessiné.
        if (el.photo) {
          const u = seg(4.1, 5.4);
          el.photo.style.opacity = String(cl(u * 5));
          el.photo.style.transform = `translateY(${(1 - eo(seg(4.1, 4.6))) * -70}px) rotate(${6 - 24 * Math.exp(-4.5 * u) * Math.cos(u * 10)}deg)`;
        }
        if (!hf.fil && t > 5 && el.photo) {
          hf.fil = true;
          const pr = el.photo.getBoundingClientRect();
          vol(pr.left + pr.width / 2, pr.top + pr.height * 0.4, R.left + R.width * 0.5, R.top + R.height * 0.55, 26);
        }
        // 8. Ensuite, la scène vit : quelques scintillements sur les héros.
        if (t > 6.2 && Math.random() < 0.05) {
          const e = el.persos[(Math.random() * PERSONNAGES.length) | 0];
          if (e) {
            const r = e.getBoundingClientRect();
            etincelle(r.left + Math.random() * r.width, r.top + Math.random() * r.height * 0.7, { life: 34, r: 2.5 + Math.random() * 3, g: 0, star: true });
          }
        }
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(image);
    };

    const relancer = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(image);
    };
    // Hors de l'écran : l'horloge s'arrête (batterie du téléphone).
    const obs = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
      relancer();
    });
    obs.observe(sc);
    document.addEventListener("visibilitychange", relancer);
    raf = requestAnimationFrame(image);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      document.removeEventListener("visibilitychange", relancer);
    };
  }, []);

  // Parallaxe : les héros suivent un peu la souris (souris seulement).
  const bouge = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== "mouse") return;
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", String(((ev.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty("--my", String(((ev.clientY - r.top) / r.height - 0.5) * 2));
  };
  const quitte = () => {
    sceneRef.current?.style.setProperty("--mx", "0");
    sceneRef.current?.style.setProperty("--my", "0");
  };

  return (
    <div ref={sceneRef} onPointerMove={bouge} onPointerLeave={quitte} className="scene-magie relative mx-auto aspect-square w-[86%] max-w-[560px] sm:w-full">
      {/* La scène peinte, fondue dans la nuit, et le voile noir que la lumière du livre dissipe */}
      <div className="scene-fond absolute inset-0">
        <img
          data-h="img"
          src="/vitrine/scene.webp"
          alt="Léo ouvre son livre : une lumière dorée monte des pages"
          width={1000}
          height={1000}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div data-h="voile" className="scene-voile" aria-hidden="true" />
      </div>

      {/* La lumière du livre : éclair, rayons, halo, cœur, ondes de choc */}
      <div data-h="flash" className="scene-flash" aria-hidden="true" />
      <div data-h="rays" className="scene-rayons" aria-hidden="true" />
      <div data-h="lum" className="scene-lum" aria-hidden="true" />
      <div data-h="core" className="scene-coeur" aria-hidden="true" />
      <div data-h="ring0" className="scene-onde" aria-hidden="true" />
      <div data-h="ring1" className="scene-onde scene-onde-rose" aria-hidden="true" />

      {/* Les personnages qui sortent du livre */}
      {PERSONNAGES.map((p, i) => (
        <span
          key={p.nom}
          data-perso={i}
          className="scene-perso"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.l}%`, transform: `translate(-50%,-50%) rotate(${p.r}deg)` }}
        >
          <span className="scene-parallaxe" style={{ ["--d" as string]: `${p.d}px` }}>
                <img src={`/vitrine/perso-${p.nom}.webp`} alt={p.alt} className="block h-auto w-full" />
          </span>
        </span>
      ))}

      {/* Sa photo, épinglée : c'est bien lui */}
      <figure data-h="photo" className="scene-photo absolute -bottom-3 right-[3%] w-[24%] rounded-[4px] bg-white p-1.5 pb-6 shadow-conte sm:-bottom-4 sm:p-2 sm:pb-7">
        <span className="scene-punaise" aria-hidden="true" />
        <img src={LIVRE_VITRINE.photo} alt="La vraie photo de Léo" className="aspect-[3/4] w-full rounded-[2px] object-cover" />
        <figcaption className="absolute inset-x-0 bottom-1 text-center font-serif text-[11px] italic leading-tight text-nuit sm:bottom-1.5 sm:text-[13px]">
          Sa photo
        </figcaption>
      </figure>

      <button type="button" onClick={rejouer} className="scene-rejouer">
        ✦ Rejouer la magie
      </button>
    </div>
  );
}
