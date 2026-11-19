/**
 * Étincelles dorées dessinées sur un <canvas> plein écran, au-dessus de la
 * page, sans jamais capter les clics. Le canvas n'est créé qu'au premier
 * appel et la boucle s'arrête dès qu'il n'y a plus d'étincelle : rien ne
 * tourne quand rien ne brille.
 *
 * Si le visiteur a demandé « réduire les animations », aucune étincelle.
 */

type Particule = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; r: number; g: number;
  star: boolean; col: string; rot: number;
  curl?: number; tx?: number; ty?: number;
};

/** Poussière d'or. */
const PALETTE = ["#ffe39a", "#ffd98a", "#fff1c2", "#ff9fd6", "#ffffff"];
const PLAFOND = 900;

let cv: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: Particule[] = [];
let raf = 0;

export function mouvementReduit(): boolean {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function redimensionner() {
  if (!cv || !ctx) return;
  const d = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * d;
  cv.height = innerHeight * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}

function canvas(): CanvasRenderingContext2D | null {
  if (ctx) return ctx;
  cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "80" });
  document.body.appendChild(cv);
  ctx = cv.getContext("2d");
  redimensionner();
  window.addEventListener("resize", redimensionner);
  return ctx;
}

function etoile(c: CanvasRenderingContext2D, p: Particule, a: number) {
  c.globalAlpha = a * 0.55;
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
  g.addColorStop(0, p.col);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(p.x, p.y, p.r * 4, 0, 6.283);
  c.fill();
  c.globalAlpha = a;
  c.fillStyle = "#fff";
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.rot);
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? p.r * 0.35 : p.r * 2.2;
    const an = (i * Math.PI) / 4;
    c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
  }
  c.closePath();
  c.fill();
  c.restore();
}

function point(c: CanvasRenderingContext2D, p: Particule, a: number) {
  c.globalAlpha = a;
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.3, p.col);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(p.x, p.y, p.r * 3, 0, 6.283);
  c.fill();
}

function boucle() {
  const c = ctx;
  if (!c) return;
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, innerWidth, innerHeight);
  c.globalCompositeOperation = "lighter";
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (!p) continue;
    if (p.tx != null && p.ty != null) {
      const k = 1 - p.life / p.max;
      p.vx = (p.vx + (p.tx - p.x) * 0.012 * k) * 0.9;
      p.vy = (p.vy + (p.ty - p.y) * 0.012 * k) * 0.9;
      if (Math.hypot(p.tx - p.x, p.ty - p.y) < 6) p.life = Math.min(p.life, 4);
    }
    if (p.curl) {
      const co = Math.cos(p.curl), si = Math.sin(p.curl), vx = p.vx;
      p.vx = vx * co - p.vy * si;
      p.vy = vx * si + p.vy * co;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.vx *= 0.985;
    p.life -= 1;
    p.rot += 0.05;
    if (p.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    const a = Math.min(1, (p.life / p.max) * 1.6) * (0.6 + 0.4 * Math.sin(p.life * 0.5));
    if (p.star) etoile(c, p, a);
    else point(c, p, a);
  }
  c.globalAlpha = 1;
  // Plus rien ne brille : on s'arrête (le prochain appel relance).
  if (parts.length) raf = requestAnimationFrame(boucle);
  else {
    c.clearRect(0, 0, innerWidth, innerHeight);
    raf = 0;
  }
}

/** Ajoute une étincelle (coordonnées de l'écran, en pixels). */
export function etincelle(x: number, y: number, o: Partial<Particule> = {}): void {
  if (mouvementReduit() || parts.length >= PLAFOND || !canvas()) return;
  const life = o.life ?? 60;
  parts.push({
    x, y, vx: 0, vy: 0, r: 2, g: 0.03, star: Math.random() < 0.35,
    col: PALETTE[(Math.random() * PALETTE.length) | 0] ?? "#ffd98a", rot: Math.random() * 3,
    ...o, life, max: life,
  });
  if (!raf) raf = requestAnimationFrame(boucle);
}

/** Une gerbe de n étincelles qui jaillit d'un point. */
export function gerbe(x: number, y: number, n: number, o: { s?: number; big?: boolean; up?: number } = {}): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (o.s ?? 1) * (1.2 + Math.random() * 4);
    etincelle(x, y, {
      vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.85 - (o.up ?? 1),
      life: 50 + Math.random() * 50, r: 1.2 + Math.random() * (o.big ? 3.5 : 2.4), g: 0.05, star: Math.random() < 0.5,
    });
  }
}

/** Un fil d'étoiles qui vole d'un point vers une cible. */
export function vol(x: number, y: number, tx: number, ty: number, n: number): void {
  for (let i = 0; i < n; i++) {
    etincelle(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 8, {
      tx, ty, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 3, life: 70, r: 1.4 + Math.random() * 2, g: 0, star: true,
    });
  }
}

/** Un rideau d'étincelles le long d'une ligne verticale (la reliure, le bord d'une page). */
export function ligne(x: number, y0: number, y1: number, n: number, sens: -1 | 1 = -1): void {
  for (let i = 0; i < n; i++) {
    etincelle(x + (Math.random() - 0.5) * 10, y0 + Math.random() * (y1 - y0), {
      vx: sens * (1 + Math.random() * 3.5), vy: -Math.random() * 1.2, life: 40 + Math.random() * 40, r: 1 + Math.random() * 2.4, g: 0.02,
    });
  }
}
