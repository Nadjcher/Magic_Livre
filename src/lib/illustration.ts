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
import { blobEnabled, compressImage, putBlob } from "./blobStore";
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
  /**
   * Image « ancre » du personnage (généralement la couverture déjà générée) :
   * passée en référence pour garder EXACTEMENT le même héros (visage, tenue,
   * style) d'une page à l'autre. C'est la clé de la cohérence du livre.
   */
  anchorImage?: { base64: string; mime: string };
  /** true : utilise le modèle d'image premium (meilleure qualité). */
  premium?: boolean;
  /** Fiche des personnages secondaires récurrents (en anglais). */
  recurringCharacters?: string;
}

export interface IllustrationResult {
  /** URL (http ou data:) de l'image, ou null si désactivé / échec. */
  imageUrl: string | null;
  /** Base64 de l'image générée (pour réutiliser la couverture comme ancre). */
  base64?: string;
  mime?: string;
  /** Raison de l'échec (diagnostic), si aucune image. */
  error?: string;
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
      // Jusqu'à 3 essais : Gemini renvoie parfois « trop de requêtes » (429)
      // ou une erreur passagère (500/503) quand on dessine plusieurs pages.
      let img: { base64: string; mime: string } | null = null;
      let error = "";
      for (let essai = 0; essai < 3 && !img; essai++) {
        if (essai > 0) await new Promise((r) => setTimeout(r, essai * 4000));
        const r = await geminiImage(prompt, model, req.referenceImage, req.anchorImage);
        if ("img" in r) img = r.img;
        else {
          error = r.error;
          if (!r.retry) break;
        }
      }
      if (!img) {
        console.error("[image] échec Gemini :", error);
        return { imageUrl: null, error };
      }
      return {
        imageUrl: await storeImage(img.base64, img.mime, seed),
        base64: img.base64,
        mime: img.mime,
      };
    }
    if (provider === "fal") {
      const model = req.premium ? env.falImageModelPremium() : env.falImageModel();
      let img: { base64: string; mime: string } | null = null;
      let error = "";
      for (let essai = 0; essai < 3 && !img; essai++) {
        if (essai > 0) await new Promise((r) => setTimeout(r, essai * 4000));
        const r = await falImage(prompt, model, req.referenceImage, req.anchorImage);
        if ("img" in r) img = r.img;
        else {
          error = r.error;
          if (!r.retry) break;
        }
      }
      if (!img) {
        console.error("[image] échec fal :", error);
        return { imageUrl: null, error };
      }
      return { imageUrl: await storeImage(img.base64, img.mime, seed), base64: img.base64, mime: img.mime };
    }
    // "none" ou valeur inconnue : pas d'image.
    return { imageUrl: null };
  } catch (e) {
    // Jamais faire échouer la création d'un livre à cause d'une image.
    return { imageUrl: null, error: String(e).slice(0, 200) };
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
  // Recompression JPEG : ~6× plus léger, sans perte visible (base, Blob et PDF).
  const c = await compressImage(Buffer.from(base64, "base64"), mime);
  const dataUrl = `data:${c.mime};base64,${c.bytes.toString("base64")}`;
  if (!blobEnabled()) return dataUrl;
  try {
    const ext = c.mime.includes("jpeg") ? "jpg" : c.mime.includes("webp") ? "webp" : "png";
    return await putBlob(`illustrations/${seed}.${ext}`, c.bytes, c.mime);
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
  anchor?: { base64: string; mime: string },
): Promise<{ img: { base64: string; mime: string } } | { error: string; retry: boolean }> {
  const key = env.geminiApiKey();
  if (!key) return { error: "GEMINI_API_KEY absente", retry: false };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // On fournit jusqu'à deux références, dans cet ordre :
  //  1) la photo de l'enfant (ressemblance) ;
  //  2) l'image « ancre » = le personnage déjà dessiné (cohérence entre pages).
  const parts: Array<Record<string, unknown>> = [];
  const consignes: string[] = [];

  if (reference) {
    parts.push({ inlineData: { mimeType: reference.mime, data: reference.base64 } });
    consignes.push(
      "PHOTO DE RÉFÉRENCE (image 1) : c'est le vrai enfant, héros du livre. Le personnage " +
        "DOIT lui ressembler de façon évidente — mêmes cheveux (couleur + coiffure), mêmes yeux, " +
        "même teint, même forme de visage, même âge. N'invente pas un enfant générique.",
    );
  }
  if (anchor) {
    parts.push({ inlineData: { mimeType: anchor.mime, data: anchor.base64 } });
    consignes.push(
      `IMAGE DE RÉFÉRENCE DU PERSONNAGE (image ${reference ? 2 : 1}) : utilise-la UNIQUEMENT pour ` +
        "l'identité de l'enfant — même visage, mêmes cheveux, même teint, mêmes vêtements, même " +
        "style de dessin. NE COPIE PAS sa pose, son cadrage ni sa composition : dessine une NOUVELLE " +
        "image qui suit fidèlement la SCÈNE ci-dessous (action, plan, décor, autres personnages). " +
        "Sauf si la scène le demande, montre l'enfant en entier ou en plan moyen, en mouvement.",
    );
  }

  const texte =
    (consignes.length > 0
      ? "CONSIGNES IMPÉRATIVES DE PERSONNAGE :\n" + consignes.join("\n") + "\n\nSCÈNE À DESSINER : "
      : "") + prompt;
  parts.push({ text: texte });

  let res;
  try {
    res = await fetchAllWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
      // Le modèle premium peut dépasser 40 s par image.
      { timeoutMs: 110_000, maxBytes: 25_000_000 },
    );
  } catch (e) {
    return { error: `réseau/délai : ${String(e).slice(0, 120)}`, retry: true };
  }

  if (!res.ok || !res.bytes) {
    const detail = res.bytes?.toString("utf8").slice(0, 220).replace(/\s+/g, " ") ?? "";
    // 429 = trop de requêtes, 5xx = panne passagère → on réessaie.
    // 402/403/400 (crédits épuisés, clé refusée…) → inutile de réessayer.
    return {
      error: `HTTP ${res.status} ${detail}`,
      retry: res.status === 429 || res.status >= 500,
    };
  }
  let data: {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
    promptFeedback?: { blockReason?: string };
  };
  try {
    data = JSON.parse(res.bytes.toString("utf8"));
  } catch {
    return { error: "réponse illisible", retry: true };
  }

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const inline = part?.inlineData;
  if (!inline?.data) {
    const raison =
      data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? "aucune image";
    return { error: `pas d'image (${raison})`, retry: true };
  }
  return { img: { base64: inline.data, mime: inline.mimeType ?? "image/png" } };
}

/**
 * Génère une image via fal (FLUX.2, Seedream, Gemini…). Avec des références
 * (photo, personnage déjà dessiné), on utilise le modèle « /edit » ; sans
 * référence, sa variante texte → image.
 */
async function falImage(
  prompt: string,
  model: string,
  reference?: { base64: string; mime: string },
  anchor?: { base64: string; mime: string },
): Promise<{ img: { base64: string; mime: string } } | { error: string; retry: boolean }> {
  const key = env.falApiKey();
  if (!key) return { error: "FAL_API_KEY absente", retry: false };

  const refs = [reference, anchor].filter((r): r is { base64: string; mime: string } => Boolean(r));
  const consignes: string[] = [];
  if (reference) {
    consignes.push(
      "Reference image 1 is the real child, hero of the book: the character MUST clearly look like this " +
        "child (same hair color and style, eyes, skin tone, face shape, age), drawn in the requested style.",
    );
  }
  if (anchor) {
    consignes.push(
      `Reference image ${reference ? 2 : 1} shows the hero as already drawn in this book: keep EXACTLY the ` +
        "same character design, outfit and art style. Do NOT copy its pose, framing or vignette shape: draw a " +
        "completely NEW full-bleed scene that follows the description below.",
    );
  }
  const texte = consignes.length ? `${consignes.join(" ")} ${prompt}` : prompt;

  let endpoint = model;
  if (refs.length === 0 && model.endsWith("/edit")) {
    endpoint = model.includes("seedream") ? model.replace(/\/edit$/, "/text-to-image") : model.replace(/\/edit$/, "");
  }
  const gemini = /nano-banana|gemini/.test(endpoint);
  const body: Record<string, unknown> = {
    prompt: texte,
    output_format: "jpeg",
    ...(gemini ? { aspect_ratio: "16:9" } : { image_size: "landscape_16_9" }),
    ...(refs.length ? { image_urls: refs.map((r) => `data:${r.mime};base64,${r.base64}`) } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(150_000),
    });
  } catch (e) {
    return { error: `réseau/délai : ${String(e).slice(0, 120)}`, retry: true };
  }
  const j = (await res.json().catch(() => ({}))) as { images?: { url?: string }[]; detail?: unknown };
  if (!res.ok) {
    const detail = JSON.stringify(j.detail ?? j).slice(0, 200);
    // 429 / limite de requêtes simultanées / 5xx → on réessaie.
    return { error: `HTTP ${res.status} ${detail}`, retry: res.status === 429 || res.status >= 500 || /concurrent/i.test(detail) };
  }
  const url = j.images?.[0]?.url;
  if (!url) return { error: "pas d'image renvoyée", retry: true };
  const dl = await fetchAllWithTimeout(url, {}, { timeoutMs: 30_000, maxBytes: 20_000_000 }).catch(() => null);
  if (!dl?.ok || !dl.bytes) return { error: "téléchargement de l'image impossible", retry: true };
  return { img: { base64: dl.bytes.toString("base64"), mime: dl.contentType || "image/jpeg" } };
}

/** Indique si la génération d'images est activée. */
export function illustrationsEnabled(): boolean {
  return env.imageProvider() !== "none";
}

// Modèle de vision retenu (mis en cache). Google retire régulièrement des
// modèles (« gemini-2.5-flash n'est plus disponible ») : en cas de 404, on
// choisit automatiquement le modèle « flash » le plus récent accessible.
let modeleVision: string | null = null;

async function choisirModeleVision(key: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${key}`,
    );
    const j = (await r.json()) as {
      models?: { name: string; supportedGenerationMethods?: string[] }[];
    };
    const candidats = (j.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""))
      .filter((n) => /flash/i.test(n) && !/image|tts|live|audio|embed|lite|thinking|exp|preview/i.test(n));
    // Version la plus élevée d'abord (gemini-3.8-flash avant gemini-3-flash…).
    const version = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
    candidats.sort((a, b) => version(b) - version(a) || a.length - b.length);
    return candidats[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Décrit en une courte phrase l'apparence physique d'une personne (enfant,
 * parent…) ou d'un animal/doudou à partir de sa photo, via Gemini. Sert
 * UNIQUEMENT à dessiner un personnage ressemblant : la photo n'est ni stockée
 * ni renvoyée. Renvoie "" si indisponible ou en cas d'échec.
 */
export async function describeChildFromPhoto(
  ref: { base64: string; mime: string },
  sujet = "child",
): Promise<string> {
  const key = env.geminiApiKey();
  if (!key) return "";

  const prompt =
    `Look at this photo of a ${sujet}. In ONE short English phrase (max 25 words), describe only the ` +
    "visible physical appearance for an illustrator: approximate age, hair color and hairstyle, eye color, " +
    "skin tone, glasses or beard if any (for an animal or a plush toy: species, colors, size, distinctive " +
    "features). Do NOT name or identify the person. Output only the description, nothing else.";

  const appel = async (modele: string) =>
    fetchAllWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ inlineData: { mimeType: ref.mime, data: ref.base64 } }, { text: prompt }] },
          ],
        }),
      },
      { timeoutMs: 25_000, maxBytes: 2_000_000 },
    );

  try {
    let res = await appel(modeleVision ?? env.geminiVisionModel());
    if (res.status === 404 || res.status === 400) {
      const auto = await choisirModeleVision(key);
      if (auto) {
        modeleVision = auto;
        res = await appel(auto);
      }
    }
    if (!res.ok || !res.bytes) {
      console.error("[vision] échec", res.status, res.bytes?.toString("utf8").slice(0, 160));
      return "";
    }
    const data = JSON.parse(res.bytes.toString("utf8")) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const txt =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join(" ") ?? "";
    return txt.trim().replace(/\s+/g, " ").slice(0, 200);
  } catch {
    return "";
  }
}
