/**
 * Ressemblance réelle : génère un PORTRAIT du héros qui ressemble vraiment à
 * l'enfant, à partir de sa photo, via un modèle d'identité faciale (fal.ai,
 * ex. PuLID/FLUX ou InstantID). Ce portrait sert ensuite d'« ancre » pour
 * toutes les pages du livre (le reste du rendu reste fait par Gemini).
 *
 * La photo est envoyée au fournisseur UNIQUEMENT le temps de générer le
 * portrait ; elle n'est jamais stockée par l'application. Repli propre : si
 * FACE_PROVIDER n'est pas "fal" ou si la clé manque, la fonction est inactive.
 */

import "server-only";
import { env } from "./env";
import { fetchAllWithTimeout, fetchAsDataUrl } from "./imageFetch";

/** Indique si la génération de portrait « vraie ressemblance » est active. */
export function faceIdentityEnabled(): boolean {
  return env.faceProvider() === "fal" && env.falApiKey().length > 0;
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
  if (!faceIdentityEnabled()) return null;

  const prompt =
    "Head-and-shoulders portrait of this exact child, friendly and smiling, looking at the viewer, " +
    "soft plain background. Keep the child's real facial identity faithfully. " +
    (opts.appearance ? `Appearance: ${opts.appearance}. ` : "") +
    "Children's picture-book illustration style: " +
    opts.stylePrompt;

  try {
    const res = await fetchAllWithTimeout(
      `https://fal.run/${env.falFaceModel()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${env.falApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          // fal accepte une data URI pour les champs image.
          reference_image_url: `data:${opts.photo.mime};base64,${opts.photo.base64}`,
          image_size: "square_hd",
          num_inference_steps: 20,
        }),
      },
      { timeoutMs: 55_000, maxBytes: 30_000_000 },
    );
    if (!res.ok || !res.bytes) return null;

    const data = JSON.parse(res.bytes.toString("utf8")) as {
      images?: { url?: string }[];
      image?: { url?: string };
    };
    const url = data.images?.[0]?.url ?? data.image?.url;
    if (!url) return null;

    const dataUrl = await fetchAsDataUrl(url);
    if (!dataUrl) return null;
    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return null;
    return { base64: m[2] as string, mime: m[1] as string };
  } catch {
    return null;
  }
}
