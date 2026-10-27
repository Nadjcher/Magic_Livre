/**
 * Ressemblance réelle : génère un PORTRAIT du héros qui ressemble vraiment à
 * l'enfant, à partir de sa photo, via un modèle d'identité faciale (fal.ai,
 * ex. PuLID/FLUX). Ce portrait sert ensuite d'« ancre » pour toutes les pages
 * du livre (le rendu des scènes reste fait par Gemini).
 *
 * La photo est envoyée au fournisseur UNIQUEMENT le temps de générer le
 * portrait ; elle n'est jamais stockée par l'application. Repli propre : si
 * FACE_PROVIDER n'est pas "fal" ou si la clé manque, la fonction est inactive.
 */

import "server-only";
import { env } from "./env";
import { fetchAllWithTimeout, fetchAsDataUrl } from "./imageFetch";

/** Un modèle FLUX-PuLID met souvent 20 à 50 s (démarrage à froid compris). */
const FAL_TIMEOUT_MS = 55_000;

/** Indique si la génération de portrait « vraie ressemblance » est active. */
export function faceIdentityEnabled(): boolean {
  return env.faceProvider() === "fal" && env.falApiKey().length > 0;
}

export interface PortraitResult {
  image: { base64: string; mime: string } | null;
  /** Code HTTP renvoyé par fal (0 si pas d'appel, -1 si exception/timeout). */
  status: number;
  /** Raison de l'échec, lisible (jamais de secret). */
  error?: string;
  /** Durée de l'appel en millisecondes. */
  ms: number;
}

/**
 * Appelle fal et renvoie le portrait + un diagnostic détaillé. Utilisé par la
 * génération de livre ET par /api/health (pour voir la vraie cause d'un échec).
 * `referenceImageUrl` : data URI de la photo, ou URL publique.
 */
export async function requestPortrait(opts: {
  referenceImageUrl: string;
  stylePrompt: string;
  appearance?: string;
}): Promise<PortraitResult> {
  const started = Date.now();
  if (!faceIdentityEnabled()) {
    return { image: null, status: 0, error: "fal désactivé (FACE_PROVIDER/FAL_API_KEY)", ms: 0 };
  }

  const prompt =
    "Head-and-shoulders portrait of this exact child, friendly and smiling, looking at the viewer, " +
    "soft plain background. Keep the child's real facial identity faithfully. " +
    (opts.appearance ? `Appearance: ${opts.appearance}. ` : "") +
    "Children's picture-book illustration style: " +
    opts.stylePrompt;

  const key = env.falApiKey();
  try {
    const res = await fetchAllWithTimeout(
      `https://fal.run/${env.falFaceModel()}`,
      {
        method: "POST",
        headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          reference_image_url: opts.referenceImageUrl,
          image_size: "square_hd",
          num_inference_steps: 20,
          // L'image revient directement en data URI : une étape réseau en moins.
          sync_mode: true,
        }),
      },
      { timeoutMs: FAL_TIMEOUT_MS, maxBytes: 30_000_000 },
    );
    const ms = Date.now() - started;
    const body = res.bytes ? res.bytes.toString("utf8") : "";

    if (!res.ok) {
      const error = `HTTP ${res.status} : ${body.replaceAll(key, "***").slice(0, 300)}`;
      console.error("[fal] échec du portrait —", error);
      return { image: null, status: res.status, error, ms };
    }

    const data = JSON.parse(body) as {
      images?: { url?: string }[];
      image?: { url?: string };
      has_nsfw_concepts?: boolean[];
    };
    // Le filtre de sécurité de fal peut « noircir » l'image (faux positif
    // fréquent sur des photos d'enfants) : on écarte alors ce portrait.
    if (data.has_nsfw_concepts?.[0]) {
      const error = "portrait bloqué par le filtre de sécurité de fal (image écartée)";
      console.error("[fal]", error);
      return { image: null, status: res.status, error, ms };
    }

    const url = data.images?.[0]?.url ?? data.image?.url;
    const dataUrl = await fetchAsDataUrl(url);
    const m = dataUrl ? /^data:([^;]+);base64,(.+)$/.exec(dataUrl) : null;
    if (!m) {
      const error = "réponse fal sans image exploitable";
      console.error("[fal]", error);
      return { image: null, status: res.status, error, ms };
    }
    return { image: { base64: m[2] as string, mime: m[1] as string }, status: res.status, ms };
  } catch (e) {
    const ms = Date.now() - started;
    const error =
      (e as Error)?.name === "AbortError"
        ? `délai dépassé (${Math.round(FAL_TIMEOUT_MS / 1000)} s)`
        : String((e as Error)?.message ?? e).slice(0, 200);
    console.error("[fal] exception —", error);
    return { image: null, status: -1, error, ms };
  }
}

/**
 * Génère un portrait stylisé (buste) du héros ressemblant à l'enfant.
 * Renvoie { base64, mime } ou null (repli : on continuera sans).
 */
export async function generateCharacterPortrait(opts: {
  photo: { base64: string; mime: string };
  /** Fragment de style illustration (pour accorder le portrait au livre). */
  stylePrompt: string;
  /** Description d'apparence éventuelle (renfort). */
  appearance?: string;
}): Promise<{ base64: string; mime: string } | null> {
  const r = await requestPortrait({
    referenceImageUrl: `data:${opts.photo.mime};base64,${opts.photo.base64}`,
    stylePrompt: opts.stylePrompt,
    appearance: opts.appearance,
  });
  return r.image;
}
