/**
 * « Le livre en dessin animé » (produit payant) : TOUTE l'histoire devient une
 * vidéo.
 *
 * 1. Chaque page (et la couverture) est animée par une IA vidéo (Kling via fal).
 * 2. Le texte de chaque page est lu par une voix off (ElevenLabs via fal) : la
 *    vidéo raconte vraiment l'histoire, du début à la fin.
 * 3. Le montage (scènes bout à bout, voix calées, musique douce) est réalisé
 *    côté serveur par fal (ffmpeg) : on obtient un vrai fichier MP4.
 */

import "server-only";
import { env } from "./env";
import { getAppUrl } from "./appUrl";
import { fetchAsDataUrl } from "./imageFetch";
import type { Story, Trailer } from "./storySchema";

import { noterDepense } from "./budget";

const MODELE_VIDEO = () => process.env.TRAILER_VIDEO_MODEL || "fal-ai/kling-video/v2.5-turbo/standard/image-to-video";
const MODELE_VOIX = "fal-ai/elevenlabs/tts/multilingual-v2";
const MODELE_MONTAGE = "fal-ai/ffmpeg-api/compose";
const VOIX = () => process.env.TRAILER_VOICE || "Matilda";
export const ESSAIS_MAX = 3;

const entetes = () => ({ Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" });

/** Scènes : la couverture (titre annoncé) puis chaque page, dans l'ordre. */
export function choisirSources(story: Story): ("cover" | number)[] {
  const pages = story.pages.map((_, i) => i).filter((i) => story.pages[i]?.imageUrl);
  return story.couvertureUrl ? ["cover", ...pages] : pages;
}

/** Texte lu sur chaque scène : l'annonce du titre, puis le texte des pages. */
export function textesLus(story: Story, prenom: string, sources: ("cover" | number)[]): string[] {
  return sources.map((s) =>
    s === "cover"
      ? `${story.titre}. Une histoire pour ${prenom}.`
      : (story.pages[s]?.texte ?? "").replace(/\s+/g, " ").trim().slice(0, 900),
  );
}

/** Voix off d'un texte : URL du MP3 et durée (estimée depuis la taille, 128 kb/s). */
export async function voixOff(texte: string): Promise<{ url: string; sec: number } | null> {
  for (let essai = 0; essai < 3; essai++) {
    try {
      const r = await fetch(`https://fal.run/${MODELE_VOIX}`, {
        method: "POST",
        headers: entetes(),
        body: JSON.stringify({ text: texte, voice: VOIX(), language_code: "fr", stability: 0.5, style: 0.3, speed: 0.92 }),
        signal: AbortSignal.timeout(90_000),
      });
      const j = (await r.json()) as { audio?: { url?: string; file_size?: number } };
      if (r.ok) await noterDepense(Math.max(0.01, texte.length * 0.0001));
      if (r.ok && j.audio?.url) {
        const sec = j.audio.file_size ? (j.audio.file_size * 8) / 128_000 : texte.split(/\s+/).length / 2.4;
        return { url: j.audio.url, sec: Math.round(sec * 10) / 10 };
      }
      if (r.status !== 429 && r.status < 500) return null;
    } catch {
      /* nouvel essai */
    }
    await new Promise((ok) => setTimeout(ok, 3000 * (essai + 1)));
  }
  return null;
}

/** Envoie l'animation d'une illustration dans la file d'attente de fal. */
export async function soumettreClip(
  story: Story,
  source: "cover" | number,
  secondes: 5 | 10,
): Promise<{ statusUrl: string; responseUrl: string } | { erreur: string }> {
  const url = source === "cover" ? story.couvertureUrl : story.pages[source]?.imageUrl;
  const image = await fetchAsDataUrl(url, { maxPx: 1280, quality: 86 });
  if (!image) return { erreur: "Illustration introuvable." };
  const scene =
    source === "cover"
      ? "the hero looks at the viewer and smiles, the magical scene gently comes alive"
      : `${story.pages[source]?.scene_illustration}. Action of this moment of the story: ${story.pages[source]?.texte}`;
  const prompt =
    `${scene}. Characters act out this moment naturally and expressively, gentle cinematic camera ` +
    "movement, children's animated feature film, keep exactly the same art style, faces and outfits, no text";
  const r = await fetch(`https://queue.fal.run/${MODELE_VIDEO()}`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({
      prompt: prompt.slice(0, 2400),
      image_url: image,
      duration: String(secondes),
      negative_prompt: "blur, distortion, deformed face, extra limbs, morphing, text, watermark, scary",
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { status_url?: string; response_url?: string; detail?: unknown };
  if (r.ok) await noterDepense(0.042 * Number(secondes)); // vidéo animée : ~0,04 $ la seconde
  if (!r.ok || !j.status_url || !j.response_url) {
    return { erreur: `Vidéo refusée (${r.status}) ${JSON.stringify(j.detail ?? j).slice(0, 160)}` };
  }
  return { statusUrl: j.status_url, responseUrl: j.response_url };
}

/** Résultat d'une tâche en file d'attente fal (null = pas encore terminée). */
async function resultat(statusUrl: string, responseUrl: string): Promise<{ ok: boolean; json: Record<string, unknown> } | null> {
  const st = (await (await fetch(statusUrl, { headers: entetes() })).json()) as { status?: string };
  if (st.status !== "COMPLETED") return null;
  const res = await fetch(responseUrl, { headers: entetes() });
  return { ok: res.ok, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

// Durée réelle d'un clip Kling (24 i/s : 121 images = 5,04 s ; 241 = 10,04 s).
const dureeClipMs = (sec: number | null | undefined) => (sec === 10 ? 10_040 : 5_040);

// Durées RÉELLES des fichiers (mesurées) : le montage de fal compte la durée
// complète de chaque MP3, marge d'encodage comprise. Clé = nom du fichier.
const SILENCES: [number, number][] = [
  [6400, 6426], [3200, 3239], [1600, 1646], [800, 836], [400, 444], [200, 235], [100, 131],
];
const BOUCLES: [number, number][] = [[12_800, 12_826], [6_400, 6_426], [3_200, 3_239]];

/** Décompose une durée en morceaux de silence (précision ~0,13 s). */
function silences(base: string, ms: number): { url: string; duration: number }[] {
  const out: { url: string; duration: number }[] = [];
  let reste = ms;
  for (const [nom, reel] of SILENCES) {
    while (reste >= reel - 40) {
      out.push({ url: `${base}silence-${nom}.mp3`, duration: reel });
      reste -= reel;
    }
  }
  return out;
}

/**
 * Lance le montage final : scènes bout à bout, voix calées, musique douce.
 * Le montage de fal place les morceaux de chaque piste BOUT À BOUT (il ignore
 * les horodatages) et joue chaque clip EN ENTIER : une scène dure donc un
 * nombre entier de clips, et la voix de chaque scène est encadrée de silences
 * exacts pour tomber pile sur ses images.
 */
async function soumettreMontage(t: Trailer): Promise<{ statusUrl: string; responseUrl: string } | { erreur: string }> {
  const base = `${getAppUrl()}/musique/`;
  const video: { url: string; timestamp: number; duration: number }[] = [];
  const voix: { url: string; timestamp: number; duration: number }[] = [];
  let t0 = 0;
  let tv = 0; // position courante de la piste voix
  const ajouterVoix = (url: string, duration: number) => {
    voix.push({ url, timestamp: tv, duration });
    tv += duration;
  };
  for (const s of t.scenes) {
    const clip = dureeClipMs(s.clipSec);
    const voixMs = Math.round((s.audioSec ?? 0) * 1000);
    const besoin = Math.max(voixMs + 1200, 4000);
    const n = Math.max(1, Math.ceil(besoin / clip));
    for (let k = 0; k < n; k++) video.push({ url: s.clipUrl!, timestamp: t0 + k * clip, duration: clip });
    const finScene = t0 + n * clip;
    // Silence jusqu'au début de la phrase (0,4 s après le début de la scène)…
    for (const x of silences(base, t0 + 400 - tv)) ajouterVoix(x.url, x.duration);
    if (s.audioUrl && voixMs > 0) ajouterVoix(s.audioUrl, voixMs);
    // …puis silence jusqu'à la fin de la scène.
    for (const x of silences(base, finScene - tv)) ajouterVoix(x.url, x.duration);
    t0 = finScene;
  }
  // Musique : morceaux qui bouclent parfaitement, sans jamais dépasser la vidéo
  // (sinon la piste son prolongerait le fichier sur un écran noir).
  const musique: { url: string; timestamp: number; duration: number }[] = [];
  let m = 0;
  for (const [nom, reel] of BOUCLES) {
    while (m + reel <= t0 - 200) {
      musique.push({ url: `${base}boucle-${nom}.mp3`, timestamp: m, duration: reel });
      m += reel;
    }
  }
  const r = await fetch(`https://queue.fal.run/${MODELE_MONTAGE}`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({
      tracks: [
        { id: "images", type: "video", keyframes: video },
        { id: "voix", type: "audio", keyframes: voix },
        ...(musique.length ? [{ id: "musique", type: "audio", keyframes: musique }] : []),
      ],
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { status_url?: string; response_url?: string; detail?: unknown };
  if (!r.ok || !j.status_url || !j.response_url) {
    return { erreur: `Montage refusé (${r.status}) ${JSON.stringify(j.detail ?? j).slice(0, 160)}` };
  }
  return { statusUrl: j.status_url, responseUrl: j.response_url };
}

/**
 * Fait avancer la création : récupère les clips terminés, puis lance le montage
 * quand tout est prêt, puis récupère la vidéo finale.
 */
export async function rafraichir(trailer: Trailer): Promise<{ trailer: Trailer; change: boolean }> {
  let change = false;
  const scenes = await Promise.all(
    trailer.scenes.map(async (s) => {
      if (s.clipUrl || s.erreur || !s.statusUrl || !s.responseUrl) return s;
      try {
        const r = await resultat(s.statusUrl, s.responseUrl);
        if (!r) return s;
        change = true;
        const url = (r.json.video as { url?: string } | undefined)?.url;
        if (r.ok && url) return { ...s, clipUrl: url };
        return { ...s, erreur: `Animation échouée : ${JSON.stringify(r.json.detail ?? r.json).slice(0, 160)}` };
      } catch {
        return s;
      }
    }),
  );
  let t: Trailer = { ...trailer, scenes };

  const prets = scenes.length > 0 && scenes.every((s) => s.clipUrl && (s.audioUrl || s.audioSec === 0));
  if (prets && !t.finalStatusUrl && !t.finalUrl && !t.finalErreur) {
    const m = await soumettreMontage(t);
    t = "erreur" in m ? { ...t, finalErreur: m.erreur } : { ...t, finalStatusUrl: m.statusUrl, finalResponseUrl: m.responseUrl };
    change = true;
  } else if (t.finalStatusUrl && t.finalResponseUrl && !t.finalUrl && !t.finalErreur) {
    try {
      const r = await resultat(t.finalStatusUrl, t.finalResponseUrl);
      if (r) {
        change = true;
        const url = r.json.video_url as string | undefined;
        t = r.ok && url ? { ...t, finalUrl: url } : { ...t, finalErreur: `Montage échoué : ${JSON.stringify(r.json.detail ?? r.json).slice(0, 160)}` };
      }
    } catch {
      /* on réessaiera au prochain passage */
    }
  }
  return { trailer: t, change };
}
