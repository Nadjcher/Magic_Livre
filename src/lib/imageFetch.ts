/**
 * Récupération robuste de ressources distantes côté serveur.
 *
 * Le délai maximal couvre AUSSI la lecture du corps (pas seulement l'arrivée des
 * en-têtes) : un flux qui se bloque après les en-têtes est donc bien interrompu.
 * Un garde-fou de taille (Content-Length puis taille réelle) évite de charger en
 * mémoire une réponse démesurée.
 */

import "server-only";

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 8_000_000; // 8 Mo par image

export interface FetchResult {
  ok: boolean;
  status: number;
  contentType: string;
  bytes: Buffer | null;
  tooLarge: boolean;
}

/**
 * `fetch` dont le délai couvre la requête ET la lecture complète du corps.
 * `maxBytes` : si connu via Content-Length, on abandonne avant de télécharger ;
 * sinon on vérifie après lecture.
 */
export async function fetchAllWithTimeout(
  url: string,
  init: RequestInit = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes }: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const contentType = res.headers.get("content-type") ?? "";

    if (maxBytes) {
      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared > maxBytes) {
        controller.abort();
        return { ok: res.ok, status: res.status, contentType, bytes: null, tooLarge: true };
      }
    }

    const bytes = Buffer.from(await res.arrayBuffer());
    if (maxBytes && bytes.length > maxBytes) {
      return { ok: res.ok, status: res.status, contentType, bytes: null, tooLarge: true };
    }
    return { ok: res.ok, status: res.status, contentType, bytes, tooLarge: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Télécharge une image et la renvoie en data URL, ou null en cas de souci. */
export async function fetchAsDataUrl(
  url: string | null | undefined,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetchAllWithTimeout(url, {}, { timeoutMs, maxBytes: MAX_IMAGE_BYTES });
    if (!res.ok || res.tooLarge || !res.bytes) return null;
    if (!res.contentType.startsWith("image/")) return null;
    if (res.bytes.length === 0) return null;
    return `data:${res.contentType};base64,${res.bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Résout une liste d'URL en data URL, avec une concurrence limitée pour ménager
 * le service d'images. L'ordre d'entrée est préservé.
 */
export async function resolveImages(
  urls: (string | null | undefined)[],
  concurrency = 4,
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(urls.length).fill(null);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < urls.length) {
      const i = next++;
      results[i] = await fetchAsDataUrl(urls[i]);
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, urls.length) }, worker);
  await Promise.all(pool);
  return results;
}
