/**
 * Bande-annonce vidéo d'un livre (produit payant).
 *
 * 1. On choisit 6 moments : la couverture + 5 pages réparties dans l'histoire.
 * 2. Une IA de texte écrit une accroche de 6 phrases courtes (style bande-annonce).
 * 3. Chaque illustration est animée par une IA vidéo (Kling via fal), en file
 *    d'attente : la création prend quelques minutes.
 * 4. Chaque phrase est lue par une voix off (ElevenLabs via fal).
 * 5. Le montage final (musique, titres, sous-titres) se fait dans le navigateur.
 */

import "server-only";
import OpenAI from "openai";
import { env } from "./env";
import { fetchAsDataUrl } from "./imageFetch";
import type { Story, Trailer } from "./storySchema";

const MODELE_VIDEO = () => process.env.TRAILER_VIDEO_MODEL || "fal-ai/kling-video/v2.5-turbo/standard/image-to-video";
const MODELE_VOIX = "fal-ai/elevenlabs/tts/multilingual-v2";
const VOIX = () => process.env.TRAILER_VOICE || "Matilda";
export const NB_SCENES = 6;
export const ESSAIS_MAX = 2;

const entetes = () => ({ Authorization: `Key ${env.falApiKey()}`, "Content-Type": "application/json" });

/** Couverture + pages réparties régulièrement dans l'histoire. */
export function choisirSources(story: Story): ("cover" | number)[] {
  const n = story.pages.length;
  const pages = Array.from({ length: NB_SCENES - 1 }, (_, k) => Math.round(((k + 0.5) * n) / (NB_SCENES - 1) - 0.5));
  const uniques = Array.from(new Set(pages.map((p) => Math.min(n - 1, Math.max(0, p)))));
  return story.couvertureUrl ? ["cover", ...uniques] : uniques;
}

/** Première phrase d'un texte, raccourcie proprement. */
function premierePhrase(t: string): string {
  const p = (t.match(/[^.!?…]+[.!?…]+/)?.[0] ?? t).trim();
  return p.length > 140 ? `${p.slice(0, 137).replace(/\s+\S*$/, "")}…` : p;
}

/** Écrit l'accroche (une phrase par scène). Repli : premières phrases des pages. */
export async function ecrireScript(story: Story, prenom: string, sources: ("cover" | number)[]): Promise<string[]> {
  const repli = sources.map((s) =>
    s === "cover" ? `Voici l'histoire de ${prenom} : ${story.titre}.` : premierePhrase(story.pages[s]?.texte ?? ""),
  );
  if (!env.groqApiKey()) return repli;
  try {
    const client = new OpenAI({ apiKey: env.groqApiKey(), baseURL: "https://api.groq.com/openai/v1" });
    const scenes = sources
      .map((s, i) => `${i + 1}. ${s === "cover" ? `Couverture : ${story.titre}` : story.pages[s]?.texte}`)
      .join("\n");
    const r = await client.chat.completions.create({
      model: env.groqModel(),
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "Tu écris la voix off d'une bande-annonce de dessin animé pour enfants, en français. Ton : " +
            "émerveillé, chaleureux, un brin de suspense, jamais effrayant. Réponds UNIQUEMENT en JSON : " +
            '{"phrases": ["...", ...]} avec EXACTEMENT une phrase par scène, 6 à 14 mots chacune, ' +
            "lisible en 4 secondes. La dernière phrase donne envie de lire le livre, sans dévoiler la fin.",
        },
        {
          role: "user",
          content: `Héros : ${prenom}. Titre : « ${story.titre} ».\nScènes, dans l'ordre :\n${scenes}`,
        },
      ],
    });
    const txt = r.choices[0]?.message?.content ?? "";
    const json = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)) as { phrases?: unknown };
    const phrases = Array.isArray(json.phrases) ? json.phrases.map((p) => String(p).trim().slice(0, 200)) : [];
    return sources.map((_, i) => phrases[i] || repli[i]!);
  } catch {
    return repli;
  }
}

/** Envoie l'animation d'une illustration dans la file d'attente de fal. */
export async function soumettreClip(
  story: Story,
  source: "cover" | number,
): Promise<{ statusUrl: string; responseUrl: string } | { erreur: string }> {
  const url = source === "cover" ? story.couvertureUrl : story.pages[source]?.imageUrl;
  const image = await fetchAsDataUrl(url, { maxPx: 1280, quality: 86 });
  if (!image) return { erreur: "Illustration introuvable." };
  const scene = source === "cover" ? "the hero smiles, the magical scene gently comes alive" : story.pages[source]?.scene_illustration;
  const prompt =
    `${scene}. Gentle cinematic camera movement, characters move naturally and expressively, ` +
    "magical sparkles, children's animated film, keep exactly the same art style and characters, no text";
  const r = await fetch(`https://queue.fal.run/${MODELE_VIDEO()}`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({
      prompt,
      image_url: image,
      duration: "5",
      negative_prompt: "blur, distortion, deformed face, extra limbs, text, watermark, scary",
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { status_url?: string; response_url?: string; detail?: unknown };
  if (!r.ok || !j.status_url || !j.response_url) {
    return { erreur: `Vidéo refusée (${r.status}) ${JSON.stringify(j.detail ?? j).slice(0, 160)}` };
  }
  return { statusUrl: j.status_url, responseUrl: j.response_url };
}

/** Voix off d'une phrase (MP3). Null en cas d'échec : la scène reste sous-titrée. */
export async function voixOff(phrase: string): Promise<string | null> {
  try {
    const r = await fetch(`https://fal.run/${MODELE_VOIX}`, {
      method: "POST",
      headers: entetes(),
      body: JSON.stringify({ text: phrase, voice: VOIX(), language_code: "fr", stability: 0.45, style: 0.35, speed: 0.95 }),
      signal: AbortSignal.timeout(60_000),
    });
    const j = (await r.json()) as { audio?: { url?: string } };
    return r.ok ? j.audio?.url ?? null : null;
  } catch {
    return null;
  }
}

/** Interroge fal pour les clips encore en cours. Renvoie la bande-annonce à jour. */
export async function rafraichir(trailer: Trailer): Promise<{ trailer: Trailer; change: boolean }> {
  let change = false;
  const scenes = await Promise.all(
    trailer.scenes.map(async (s) => {
      if (s.clipUrl || s.erreur || !s.statusUrl || !s.responseUrl) return s;
      try {
        const st = (await (await fetch(s.statusUrl, { headers: entetes() })).json()) as { status?: string };
        if (st.status !== "COMPLETED") return s;
        const res = await fetch(s.responseUrl, { headers: entetes() });
        const j = (await res.json()) as { video?: { url?: string }; detail?: unknown };
        change = true;
        if (res.ok && j.video?.url) return { ...s, clipUrl: j.video.url };
        return { ...s, erreur: `Animation échouée : ${JSON.stringify(j.detail ?? j).slice(0, 160)}` };
      } catch {
        return s;
      }
    }),
  );
  return { trailer: { ...trailer, scenes }, change };
}
