"use client";

/**
 * Bande-annonce vidéo : suit la création des scènes animées (IA vidéo) puis
 * fait le MONTAGE dans le navigateur — titre, scènes animées, voix off,
 * sous-titres, musique douce — et l'enregistre en vidéo téléchargeable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { retryScene, startTrailer, trailerStatus } from "@/app/actions/trailer";
import type { Trailer } from "@/lib/storySchema";
import Notice from "./Notice";

const W = 1280;
const H = 720;
const FPS = 30;
const TITRE_S = 3.5;
const FIN_S = 3.5;

function lignes(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const out: string[] = [];
  let ligne = "";
  for (const m of texte.split(/\s+/)) {
    const essai = ligne ? `${ligne} ${m}` : m;
    if (ctx.measureText(essai).width > largeur && ligne) {
      out.push(ligne);
      ligne = m;
    } else ligne = essai;
  }
  if (ligne) out.push(ligne);
  return out;
}

function couvrir(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, zoom = 1) {
  ctx.fillStyle = "#1b2868";
  ctx.fillRect(0, 0, W, H);
  if (!sw || !sh) return;
  const k = Math.max(W / sw, H / sh) * zoom;
  ctx.drawImage(src, (W - sw * k) / 2, (H - sh * k) / 2, sw * k, sh * k);
}

/** Petite musique douce (accords + boîte à musique), en boucle. */
function musique(audio: AudioContext, sortie: AudioNode, volumeMax: number): () => void {
  const vol = audio.createGain();
  vol.gain.value = 0.0001;
  vol.gain.exponentialRampToValueAtTime(volumeMax, audio.currentTime + 1.5);
  vol.connect(sortie);
  const accords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
  const mesure = 3.2;
  let prochain = audio.currentTime + 0.05;
  let n = 0;
  const note = (f: number, t: number, d: number, g: number, type: OscillatorType) => {
    const o = audio.createOscillator();
    const e = audio.createGain();
    o.type = type;
    o.frequency.value = f;
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(g, t + 0.04);
    e.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(e).connect(vol);
    o.start(t);
    o.stop(t + d + 0.05);
  };
  const plan = () => {
    while (prochain < audio.currentTime + 2) {
      const a = accords[n % 4]!;
      for (const f of a) note(f / 2, prochain, mesure * 1.1, 0.05, "sine");
      [0, 1, 2, 1, 2, 0, 2, 1].forEach((k, i) => note(a[k]! * 2, prochain + (i * mesure) / 8, 0.9, 0.05, "triangle"));
      prochain += mesure;
      n++;
    }
  };
  plan();
  const id = setInterval(plan, 400);
  return () => {
    clearInterval(id);
    vol.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.8);
  };
}

function formatVideo() {
  for (const c of [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return null;
}

export default function TrailerMaker({
  bookId,
  titre,
  sousTitre,
  couverture,
  initial,
  essaisMax,
  nomFichier,
}: {
  bookId: string;
  titre: string;
  sousTitre: string;
  couverture: string | null;
  initial: Trailer | null;
  essaisMax: number;
  nomFichier: string;
}) {
  const [trailer, setTrailer] = useState<Trailer | null>(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lancement, setLancement] = useState(false);
  const [montage, setMontage] = useState<"attente" | "encours" | "fini">("attente");
  const [progres, setProgres] = useState(0);
  const [video, setVideo] = useState<{ url: string; ext: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scenes = trailer?.scenes ?? [];
  const prets = scenes.filter((s) => s.clipUrl).length;
  const enEchec = scenes.filter((s) => s.erreur).length;
  const toutPret = scenes.length > 0 && prets === scenes.length;
  const enCours = scenes.length > 0 && prets + enEchec < scenes.length;

  // Suivi de la création (toutes les 8 s tant que des scènes sont en cours).
  const suivre = useCallback(async () => {
    const r = await trailerStatus(bookId);
    if (r.ok && r.trailer !== undefined) setTrailer(r.trailer);
    else if (!r.ok) setErreur(r.message ?? "Erreur.");
  }, [bookId]);
  useEffect(() => {
    if (!enCours) return;
    const id = setInterval(suivre, 8000);
    return () => clearInterval(id);
  }, [enCours, suivre]);

  useEffect(() => () => { if (video) URL.revokeObjectURL(video.url); }, [video]);

  async function lancer() {
    setErreur(null);
    setLancement(true);
    const r = await startTrailer(bookId);
    setLancement(false);
    if (r.ok) {
      setTrailer(r.trailer ?? null);
      setVideo(null);
      setMontage("attente");
    } else setErreur(r.message ?? "Erreur.");
  }

  async function relancer(i: number) {
    const r = await retryScene(bookId, i);
    if (r.ok && r.trailer) setTrailer(r.trailer);
    else setErreur(r.message ?? "Erreur.");
  }

  async function monter() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const fmt = formatVideo();
    if (!canvas || !ctx || !fmt || typeof canvas.captureStream !== "function") {
      setErreur("Ce navigateur ne sait pas enregistrer de vidéo. Essayez avec Chrome, Edge ou Safari récent.");
      return;
    }
    setMontage("encours");
    setErreur(null);
    const police = (sel: string) => getComputedStyle(document.querySelector(sel) ?? document.body).fontFamily;
    const fTitre = police("h1, h2");
    const fTexte = police("body");

    // Chargement : clips (en local pour une lecture fluide), voix, couverture.
    const audio = new AudioContext();
    const clips = await Promise.all(
      scenes.map(async (s) => {
        const blob = await (await fetch(s.clipUrl!)).blob();
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.src = URL.createObjectURL(blob);
        await new Promise((ok) => { v.onloadeddata = ok; v.onerror = ok; });
        const voix = s.audioUrl
          ? await fetch(s.audioUrl).then((r) => r.arrayBuffer()).then((b) => audio.decodeAudioData(b)).catch(() => null)
          : null;
        const duree = Math.max(v.duration || 5, voix ? voix.duration + 0.7 : 0, 4);
        return { v, voix, duree, phrase: s.phrase };
      }),
    );
    const couv = await new Promise<HTMLImageElement | null>((ok) => {
      if (!couverture) return ok(null);
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = couverture;
    });

    const dest = audio.createMediaStreamDestination();
    const voixBus = audio.createGain();
    voixBus.gain.value = 1;
    voixBus.connect(dest);
    const stopMusique = musique(audio, dest, 0.16);
    const flux = canvas.captureStream(FPS);
    dest.stream.getAudioTracks().forEach((p) => flux.addTrack(p));
    const morceaux: Blob[] = [];
    const rec = new MediaRecorder(flux, { mimeType: fmt.mime, videoBitsPerSecond: 6_000_000 });
    rec.ondataavailable = (e) => e.data.size > 0 && morceaux.push(e.data);
    const fin = new Promise<void>((ok) => (rec.onstop = () => ok()));

    const debuts: number[] = [];
    let t = TITRE_S;
    for (const c of clips) {
      debuts.push(t);
      t += c.duree;
    }
    const total = t + FIN_S;

    rec.start(1000);
    const t0 = performance.now();
    const a0 = audio.currentTime;
    // Voix off programmées à l'avance, calées sur le début de chaque scène.
    clips.forEach((c, i) => {
      if (!c.voix) return;
      const src = audio.createBufferSource();
      src.buffer = c.voix;
      src.connect(voixBus);
      src.start(a0 + debuts[i]! + 0.3);
    });

    let lance = -1;
    await new Promise<void>((ok) => {
      const image = () => {
        const s = (performance.now() - t0) / 1000;
        if (s >= total) return ok();
        setProgres(Math.round((s / total) * 100));
        if (s < TITRE_S) {
          if (couv) couvrir(ctx, couv, couv.width, couv.height, 1.05 + 0.04 * (s / TITRE_S));
          else couvrir(ctx, canvas, 0, 0);
          const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
          g.addColorStop(0, "rgba(15,26,68,0)");
          g.addColorStop(1, "rgba(15,26,68,0.9)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          ctx.save();
          ctx.globalAlpha = Math.min(1, s / 0.8);
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.shadowColor = "rgba(0,0,0,.5)";
          ctx.shadowBlur = 16;
          ctx.font = `600 60px ${fTitre}`;
          const ls = lignes(ctx, titre, W - 200);
          ls.forEach((l, k) => ctx.fillText(l, W / 2, H - 140 - (ls.length - 1 - k) * 68));
          ctx.font = `400 28px ${fTexte}`;
          ctx.fillStyle = "#cdd7f4";
          ctx.fillText(sousTitre, W / 2, H - 82);
          ctx.restore();
        } else if (s < total - FIN_S) {
          const i = Math.max(0, debuts.findLastIndex((d) => s >= d));
          const c = clips[i]!;
          if (lance !== i) {
            lance = i;
            c.v.currentTime = 0;
            void c.v.play().catch(() => undefined);
          }
          couvrir(ctx, c.v, c.v.videoWidth, c.v.videoHeight);
          // Fondu d'entrée de scène.
          const local = s - debuts[i]!;
          if (local < 0.5) {
            ctx.fillStyle = `rgba(15,26,68,${1 - local / 0.5})`;
            ctx.fillRect(0, 0, W, H);
          }
          // Sous-titre.
          if (c.phrase && local > 0.3) {
            ctx.save();
            ctx.font = `600 34px ${fTexte}`;
            const ls = lignes(ctx, c.phrase, W - 260).slice(0, 3);
            const h = ls.length * 46 + 36;
            ctx.fillStyle = "rgba(10,16,48,0.62)";
            ctx.beginPath();
            ctx.roundRect(110, H - h - 40, W - 220, h, 24);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ls.forEach((l, k) => ctx.fillText(l, W / 2, H - h - 40 + 50 + k * 46));
            ctx.restore();
          }
        } else {
          const a = Math.min(1, (s - (total - FIN_S)) / 0.8);
          ctx.fillStyle = "#1b2868";
          ctx.fillRect(0, 0, W, H);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.font = `600 54px ${fTitre}`;
          ctx.fillText(titre.length > 40 ? "À lire dans le livre…" : titre, W / 2, H / 2 - 10);
          ctx.font = `400 26px ${fTexte}`;
          ctx.fillStyle = "#b9c4ee";
          ctx.fillText("Une histoire créée avec Storilou", W / 2, H / 2 + 50);
          ctx.restore();
        }
        requestAnimationFrame(image);
      };
      requestAnimationFrame(image);
    });

    stopMusique();
    await new Promise((r) => setTimeout(r, 400));
    rec.stop();
    await fin;
    await audio.close();
    flux.getTracks().forEach((p) => p.stop());
    clips.forEach((c) => URL.revokeObjectURL(c.v.src));
    setVideo({ url: URL.createObjectURL(new Blob(morceaux, { type: fmt.mime.split(";")[0] })), ext: fmt.ext });
    setMontage("fini");
    setProgres(100);
  }

  const essais = trailer?.essais ?? 0;

  return (
    <div className="space-y-5">
      {!trailer && (
        <div className="carte space-y-3">
          <p>
            6 moments de l'histoire prennent vie : les personnages bougent, la caméra se
            déplace, une voix raconte et une musique accompagne le tout. Environ 40 secondes.
          </p>
          <button type="button" className="btn-primaire" onClick={lancer} disabled={lancement}>
            {lancement ? "Lancement…" : "🎬 Créer la bande-annonce"}
          </button>
          <p className="text-sm text-magique-texteClair">
            La création prend environ 5 à 10 minutes. Vous pouvez fermer la page et revenir plus tard.
          </p>
        </div>
      )}

      {trailer && (
        <div className="carte space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-xl">Les scènes animées</h2>
            <span className="text-sm text-magique-texteClair">
              {prets}/{scenes.length} prêtes
            </span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {scenes.map((s, i) => (
              <li key={i} className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                {s.clipUrl ? (
                  <video src={s.clipUrl} muted loop autoPlay playsInline className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-magique-texteClair">
                    {s.erreur ? "⚠️ Échec" : "✨ En création…"}
                  </div>
                )}
                <div className="p-2 text-xs text-magique-texteClair">
                  {s.phrase || "Écriture de la voix off…"}
                  {s.erreur && (
                    <button type="button" className="mt-1 block font-semibold text-magique-primaire underline" onClick={() => relancer(i)}>
                      Réessayer cette scène
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {enCours && (
            <p className="text-sm text-magique-texteClair">
              Création en cours… cette page se met à jour toute seule (5 à 10 minutes).
            </p>
          )}
        </div>
      )}

      {toutPret && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl border border-white/15 shadow-conte">
            {video ? (
              <video src={video.url} controls playsInline className="aspect-video w-full bg-black" />
            ) : (
              <canvas ref={canvasRef} width={W} height={H} className="aspect-video w-full bg-nuit" />
            )}
          </div>
          {montage === "attente" && (
            <div className="space-y-1">
              <button type="button" className="btn-primaire" onClick={monter}>
                🎞️ Monter la vidéo finale
              </button>
              <p className="text-sm text-magique-texteClair">
                Le montage se fait en direct sur votre appareil (moins d'une minute). Gardez cet
                onglet affiché.
              </p>
            </div>
          )}
          {montage === "encours" && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-magique-primaire transition-all" style={{ width: `${progres}%` }} />
              </div>
              <p className="text-sm text-magique-texteClair">Montage… {progres} % — ne changez pas d'onglet.</p>
            </div>
          )}
          {montage === "fini" && video && (
            <div className="flex flex-wrap gap-3">
              <a href={video.url} download={`${nomFichier}.${video.ext}`} className="btn-primaire">
                ⬇️ Télécharger la vidéo
              </a>
              <button type="button" className="btn-secondaire" onClick={() => { setVideo(null); setMontage("attente"); }}>
                Refaire le montage
              </button>
            </div>
          )}
        </div>
      )}

      {trailer && !enCours && essais < essaisMax && (
        <button type="button" className="text-sm text-magique-texteClair underline" onClick={lancer} disabled={lancement}>
          Recréer toutes les scènes (encore {essaisMax - essais} essai{essaisMax - essais > 1 ? "s" : ""})
        </button>
      )}
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
    </div>
  );
}
