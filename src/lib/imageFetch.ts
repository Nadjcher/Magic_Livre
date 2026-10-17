/**
 * Récupération robuste d'images côté serveur pour la génération des PDF.
 *
 * On télécharge chaque image en data URL (avec délai maximal et garde-fou de
 * taille) AVANT de construire le PDF, plutôt que de laisser @react-pdf aller
 * chercher les URL lui-même : une image lente, absente ou trop lourde ne fait
 * alors jamais échouer tout le document (elle est simplement ignorée).
 */

import "server-only";

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 8_000_000; // 8 Mo par image

/** `fetch` avec abandon automatique au bout de `timeoutMs`. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
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
    const res = await fetchWithTimeout(url, {}, timeoutMs);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
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
