"use client";

/**
 * Vidéo souvenir d'un livre, fabriquée DANS LE NAVIGATEUR (aucun coût serveur) :
 * les illustrations s'animent (zoom et panoramique lents, fondus), le texte
 * s'affiche en bas de l'image et une petite musique douce (synthétisée en
 * direct) accompagne l'histoire. Le résultat est enregistré en vidéo (MP4 si
 * le navigateur le permet, sinon WebM) et téléchargeable.
 */

import { useEffect, useRef, useState } from "react";

type Page = { texte: string; image: string | null };

const W = 1280;
const H = 720;
const FPS = 30;
const DUREE_TITRE = 5;
const DUREE_PAGE = 7;
const DUREE_FIN = 4;
const FONDU = 0.9;

function chargerImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

/** Découpe un texte en lignes qui tiennent dans `largeur`. */
function lignes(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const mots = texte.split(/\s+/);
  const out: string[] = [];
  let ligne = "";
  for (const m of mots) {
    const essai = ligne ? `${ligne} ${m}` : m;
    if (ctx.measureText(essai).width > largeur && ligne) {
      out.push(ligne);
      ligne = m;
    } else ligne = essai;
  }
  if (ligne) out.push(ligne);
  return out;
}

/** Dessine une image en « cover » avec un zoom/panoramique lent (effet Ken Burns). */
function dessinerImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, t: number, sens: number) {
  // Fond bleu nuit d'abord : une image à zones transparentes ne laisse jamais
  // voir la scène précédente.
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#24358c");
  g.addColorStop(1, "#1b2868");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (!img) return;
  const zoom = 1.06 + 0.1 * t;
  const base = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * base;
  const h = img.height * base;
  const dx = (W - w) / 2 + sens * (t - 0.5) * 40;
  const dy = (H - h) / 2 + (t - 0.5) * 18;
  ctx.drawImage(img, dx, dy, w, h);
}

/** Musique douce : nappe d'accords + boîte à musique, en boucle. */
function demarrerMusique(audio: AudioContext, sortie: AudioNode): () => void {
  const volume = audio.createGain();
  volume.gain.value = 0.0001;
  volume.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 2);
  volume.connect(sortie);

  // Do – La m – Fa – Sol (tonalité douce et rassurante).
  const accords = [
    [261.63, 329.63, 392.0],
    [220.0, 261.63, 329.63],
    [174.61, 220.0, 261.63],
    [196.0, 246.94, 293.66],
  ];
  const mesure = 3.2;
  let arret = false;
  let prochain = audio.currentTime + 0.1;
  let n = 0;

  const note = (freq: number, debut: number, duree: number, gain: number, type: OscillatorType) => {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, debut);
    g.gain.exponentialRampToValueAtTime(gain, debut + Math.min(0.05, duree / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    o.connect(g).connect(volume);
    o.start(debut);
    o.stop(debut + duree + 0.05);
  };

  const planifier = () => {
    if (arret) return;
    while (prochain < audio.currentTime + 2) {
      const acc = accords[n % accords.length]!;
      for (const f of acc) note(f / 2, prochain, mesure * 1.1, 0.05, "sine");
      // Arpège « boîte à musique » une octave au-dessus.
      const motif = [0, 1, 2, 1, 2, 0, 2, 1];
      motif.forEach((k, i) => note(acc[k]! * 2, prochain + i * (mesure / 8), 0.9, 0.06, "triangle"));
      prochain += mesure;
      n++;
    }
  };
  planifier();
  const id = setInterval(planifier, 500);
  return () => {
    arret = true;
    clearInterval(id);
    volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1);
  };
}

function formatVideo(): { mime: string; ext: string } {
  const candidats = [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidats) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "webm" };
}

export default function VideoMaker({
  titre,
  sousTitre,
  couverture,
  pages,
  nomFichier,
}: {
  titre: string;
  sousTitre: string;
  couverture: string | null;
  pages: Page[];
  nomFichier: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [etat, setEtat] = useState<"pret" | "chargement" | "enregistrement" | "fini" | "erreur">("pret");
  const [progres, setProgres] = useState(0);
  const [video, setVideo] = useState<{ url: string; ext: string } | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => () => {
    if (video) URL.revokeObjectURL(video.url);
  }, [video]);

  // Aperçu immobile de la couverture avant le lancement.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    chargerImage(couverture).then((img) => {
      dessinerImage(ctx, img, 0.3, 1);
      voile(ctx);
      titreCarte(ctx, titre, sousTitre, 1);
    });
  }, [couverture, titre, sousTitre]);

  function police(type: "titre" | "texte"): string {
    const el = document.querySelector(type === "titre" ? "h1, h2" : "body");
    return el ? getComputedStyle(el).fontFamily : "serif";
  }

  function voile(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
    g.addColorStop(0, "rgba(15,26,68,0)");
    g.addColorStop(1, "rgba(15,26,68,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function titreCarte(ctx: CanvasRenderingContext2D, t: string, st: string, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 16;
    ctx.font = `600 58px ${police("titre")}`;
    const ls = lignes(ctx, t, W - 200);
    ls.forEach((l, i) => ctx.fillText(l, W / 2, H - 150 - (ls.length - 1 - i) * 66));
    ctx.font = `400 28px ${police("texte")}`;
    ctx.fillStyle = "#cdd7f4";
    ctx.fillText(st, W / 2, H - 90);
    ctx.restore();
  }

  function texteBas(ctx: CanvasRenderingContext2D, texte: string, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `600 34px ${police("texte")}`;
    const ls = lignes(ctx, texte, W - 220).slice(0, 5);
    const hBande = ls.length * 46 + 44;
    ctx.fillStyle = "rgba(15,26,68,0.72)";
    const x = 70;
    const y = H - hBande - 36;
    ctx.beginPath();
    ctx.roundRect(x, y, W - 140, hBande, 26);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ls.forEach((l, i) => ctx.fillText(l, W / 2, y + 56 + i * 46));
    ctx.restore();
  }

  async function lancer() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const fmt = formatVideo();
    if (!fmt.mime || typeof canvas.captureStream !== "function") {
      setEtat("erreur");
      setMessage("Ce navigateur ne sait pas enregistrer de vidéo. Essayez avec Chrome, Edge ou Safari récent.");
      return;
    }

    setEtat("chargement");
    setVideo(null);
    const [imgCouv, ...imgs] = await Promise.all([chargerImage(couverture), ...pages.map((p) => chargerImage(p.image))]);

    // Chronologie : titre, pages, fin.
    const scenes: { debut: number; duree: number; dessiner: (t: number, a: number) => void }[] = [];
    let t0 = 0;
    scenes.push({
      debut: t0,
      duree: DUREE_TITRE,
      dessiner: (t, a) => {
        dessinerImage(ctx, imgCouv, t, 1);
        voile(ctx);
        titreCarte(ctx, titre, sousTitre, a);
      },
    });
    t0 += DUREE_TITRE;
    pages.forEach((p, i) => {
      const img = imgs[i] ?? null;
      const sens = i % 2 === 0 ? -1 : 1;
      scenes.push({
        debut: t0,
        duree: DUREE_PAGE,
        dessiner: (t, a) => {
          dessinerImage(ctx, img, t, sens);
          texteBas(ctx, p.texte, Math.min(1, a * 1.2));
        },
      });
      t0 += DUREE_PAGE;
    });
    scenes.push({
      debut: t0,
      duree: DUREE_FIN,
      dessiner: (_t, a) => {
        ctx.fillStyle = "#1b2868";
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = `600 72px ${police("titre")}`;
        ctx.fillText("Fin", W / 2, H / 2);
        ctx.font = `400 26px ${police("texte")}`;
        ctx.fillStyle = "#b9c4ee";
        ctx.fillText("Une histoire créée avec Storilou", W / 2, H / 2 + 60);
        ctx.restore();
      },
    });
    const total = t0 + DUREE_FIN;

    // Flux vidéo (canvas) + musique.
    const audio = new AudioContext();
    const dest = audio.createMediaStreamDestination();
    const arreterMusique = demarrerMusique(audio, dest);
    const flux = canvas.captureStream(FPS);
    dest.stream.getAudioTracks().forEach((piste) => flux.addTrack(piste));
    const morceaux: Blob[] = [];
    const rec = new MediaRecorder(flux, { mimeType: fmt.mime, videoBitsPerSecond: 5_000_000 });
    rec.ondataavailable = (e) => e.data.size > 0 && morceaux.push(e.data);
    const finEnregistrement = new Promise<void>((ok) => (rec.onstop = () => ok()));

    setEtat("enregistrement");
    rec.start(1000);
    const depart = performance.now();

    await new Promise<void>((fini) => {
      const image = () => {
        const s = (performance.now() - depart) / 1000;
        if (s >= total) return fini();
        const i = scenes.findIndex((sc) => s >= sc.debut && s < sc.debut + sc.duree);
        const sc = scenes[i]!;
        const local = (s - sc.debut) / sc.duree;
        const apparition = Math.min(1, (s - sc.debut) / FONDU);
        sc.dessiner(local, apparition);
        // Fondu enchaîné vers la scène suivante.
        const reste = sc.debut + sc.duree - s;
        const suivante = scenes[i + 1];
        if (suivante && reste < FONDU) {
          ctx.save();
          ctx.globalAlpha = 1 - reste / FONDU;
          suivante.dessiner(0, 0);
          ctx.restore();
        }
        setProgres(Math.round((s / total) * 100));
        requestAnimationFrame(image);
      };
      requestAnimationFrame(image);
    });

    arreterMusique();
    await new Promise((r) => setTimeout(r, 300));
    rec.stop();
    await finEnregistrement;
    await audio.close();
    flux.getTracks().forEach((p) => p.stop());

    const blob = new Blob(morceaux, { type: fmt.mime.split(";")[0] });
    setVideo({ url: URL.createObjectURL(blob), ext: fmt.ext });
    setProgres(100);
    setEtat("fini");
  }

  const minutes = Math.ceil((DUREE_TITRE + pages.length * DUREE_PAGE + DUREE_FIN) / 60);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-white/15 shadow-conte">
        {video ? (
          <video src={video.url} controls playsInline className="aspect-video w-full bg-black" />
        ) : (
          <canvas ref={canvasRef} width={W} height={H} className="aspect-video w-full bg-nuit" />
        )}
      </div>

      {etat === "pret" && (
        <div className="space-y-2">
          <button type="button" className="btn-primaire" onClick={lancer}>
            🎬 Créer la vidéo
          </button>
          <p className="text-sm text-magique-texteClair">
            La vidéo se fabrique en direct sur votre appareil (environ {minutes} min). Gardez
            cet onglet ouvert et affiché pendant la création.
          </p>
        </div>
      )}
      {etat === "chargement" && <p className="text-sm">Préparation des illustrations…</p>}
      {etat === "enregistrement" && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-magique-primaire transition-all" style={{ width: `${progres}%` }} />
          </div>
          <p className="text-sm text-magique-texteClair">
            Enregistrement… {progres} % — ne changez pas d'onglet.
          </p>
        </div>
      )}
      {etat === "fini" && video && (
        <div className="flex flex-wrap gap-3">
          <a href={video.url} download={`${nomFichier}.${video.ext}`} className="btn-primaire">
            ⬇️ Télécharger la vidéo
          </a>
          <button type="button" className="btn-secondaire" onClick={() => { setVideo(null); setEtat("pret"); }}>
            Refaire la vidéo
          </button>
        </div>
      )}
      {etat === "erreur" && <p className="text-sm text-red-300">{message}</p>}
    </div>
  );
}
