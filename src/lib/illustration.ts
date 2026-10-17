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
import { env } from "./env";
import { fetchWithTimeout } from "./imageFetch";
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
      return { imageUrl: await geminiImage(prompt) };
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
 * Génère une image via l'API Gemini et renvoie une data URL base64.
 * Renvoie null si aucune clé n'est configurée ou en cas d'échec.
 */
async function geminiImage(prompt: string): Promise<string | null> {
  const key = env.geminiApiKey();
  if (!key) return null;

  const model = env.geminiImageModel();
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
    30_000,
  );

  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
  };

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const inline = part?.inlineData;
  if (!inline?.data) return null;
  const mime = inline.mimeType ?? "image/png";
  return `data:${mime};base64,${inline.data}`;
}

/** Indique si la génération d'images est activée. */
export function illustrationsEnabled(): boolean {
  return env.imageProvider() !== "none";
}
