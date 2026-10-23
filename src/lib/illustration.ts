/**
 * Génération des illustrations, côté serveur.
 *
 * Trois fournisseurs, choisis par la variable IMAGE_PROVIDER :
 *  - "none"         : aucune image (le livre reste en texte).
 *  - "pollinations" : gratuit, sans clé — renvoie une URL d'image stable.
 *  - "gemini"       : via GEMINI_API_KEY (image renvoyée en data URL base64).
 *
 * Le style visuel et la construction du prompt sont centralisés dans
 * style_config.ts. Aucune photo d'enfant n'est envoyée au modèle d'image :
 * seule une description textuelle d'apparence peut être transmise.
 */

import "server-only";
import { put } from "@vercel/blob";
import { env } from "./env";
import { fetchAllWithTimeout } from "./imageFetch";
import {
  buildIllustrationPrompt,
  type IllustrationStyle,
} from "./style_config";

export interface IllustrationRequest {
  style: IllustrationStyle;
  /** Description de la scène (champ scene_illustration), déjà filtrée. */
  scene: string;
  heroName?: string;
  /** Description d'apparence du héros (jamais la photo). */
  appearance?: string;
  /** Graine pour obtenir une image stable d'un rendu à l'autre. */
  seed?: number;
  /** true : dessin au trait noir et blanc pour le cahier de coloriage. */
  coloring?: boolean;
  /**
   * Photo de référence de l'enfant (base64), utilisée UNIQUEMENT au moment de
   * générer l'illustration pour capter sa ressemblance. Jamais stockée.
   */
  referenceImage?: { base64: string; mime: string };
  /** true : utilise le modèle d'image premium (meilleure qualité). */
  premium?: boolean;
}

export interface IllustrationResult {
  /** URL (http ou data:) de l'image, ou null si désactivé / échec. */
  imageUrl: string | null;
}

const WIDTH = 1024;
const HEIGHT = 640; // ratio paysage, cohérent avec le PDF A4 paysage

/** Génère une illustration selon le fournisseur configuré. */
export async function generateIllustration(
  req: IllustrationRequest,
): Promise<IllustrationResult> {
  const provider = env.imageProvider();
  const prompt = buildIllustrationPrompt(req);
  const seed = req.seed ?? 42;

  try {
    if (provider === "pollinations") {
      return { imageUrl: pollinationsUrl(prompt, seed) };
    }
    if (provider === "gemini") {
      const model = req.premium ? env.geminiImageModelPremium() : env.geminiImageModel();
      const img = await geminiImage(prompt, model, req.referenceImage);
      if (!img) return { imageUrl: null };
      return { imageUrl: await storeImage(img.base64, img.mime, seed) };
    }
    // "none" ou valeur inconnue : pas d'image.
    return { imageUrl: null };
  } catch {
    // Jamais faire échouer la création d'un livre à cause d'une image.
    return { imageUrl: null };
  }
}

/**
 * Construit une URL d'image Pollinations (gratuit, sans clé). L'image est
 * générée à la volée par le service et mise en cache par (prompt + seed).
 */
function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return (
    `https://image.pollinations.ai/prompt/${encoded}` +
    `?width=${WIDTH}&height=${HEIGHT}&nologo=true&model=flux&seed=${seed}`
  );
}

/**
 * Stocke l'image. Si un store Vercel Blob est configuré
 * (BLOB_READ_WRITE_TOKEN), renvoie une URL légère ; sinon repli sur une data
 * URL base64 (fonctionne, mais plus lourd en base).
 */
async function storeImage(base64: string, mime: string, seed: number): Promise<string> {
  const dataUrl = `data:${mime};base64,${base64}`;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return dataUrl;
  try {
    const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
    const blob = await put(
      `illustrations/${seed}-${Date.now()}.${ext}`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: mime },
    );
    return blob.url;
  } catch {
    return dataUrl;
  }
}

/**
 * Génère une image via l'API Gemini et renvoie le base64 + le type MIME.
 * Renvoie null si aucune clé n'est configurée ou en cas d'échec.
 */
async function geminiImage(
  prompt: string,
  model: string,
  reference?: { base64: string; mime: string },
): Promise<{ base64: string; mime: string } | null> {
  const key = env.geminiApiKey();
  if (!key) return null;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // Avec une photo de référence : on demande une illustration qui préserve la
  // ressemblance de l'enfant, sans copier la photo.
  const parts: Array<Record<string, unknown>> = [];
  let texte = prompt;
  if (reference) {
    parts.push({ inlineData: { mimeType: reference.mime, data: reference.base64 } });
    texte =
      "CRITICAL — CHARACTER LIKENESS: The attached photo IS the real child who is the hero of this book. " +
      "The main character MUST look unmistakably like this exact child — a parent must instantly recognize their kid. " +
      "Faithfully reproduce: the same face shape, the same hair color AND hairstyle, the same eye color and eye shape, " +
      "the same skin tone, the same eyebrows, and the same approximate age. Do NOT invent a generic child, do NOT change " +
      "the hair or skin color. Keep this identical likeness on EVERY page and on the cover. " +
      "Then stylize this same child as a charming children's-book character in the requested art style " +
      "(illustrated, not a photograph, no photorealism), full body in the scene. " +
      "SCENE: " +
      prompt;
  }
  parts.push({ text: texte });

  const res = await fetchAllWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    },
    { timeoutMs: 40_000, maxBytes: 25_000_000 },
  );

  if (!res.ok || !res.bytes) return null;
  let data: {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
  };
  try {
    data = JSON.parse(res.bytes.toString("utf8"));
  } catch {
    return null;
  }

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const inline = part?.inlineData;
  if (!inline?.data) return null;
  return { base64: inline.data, mime: inline.mimeType ?? "image/png" };
}

/** Indique si la génération d'images est activée. */
export function illustrationsEnabled(): boolean {
  return env.imageProvider() !== "none";
}
