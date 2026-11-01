/**
 * Accès au stockage Vercel Blob + compression des images.
 *
 * Le jeton est cherché sous son nom standard (BLOB_READ_WRITE_TOKEN) MAIS aussi
 * sous un nom préfixé (ex. STORILOU_IMAGES_READ_WRITE_TOKEN) : Vercel propose un
 * « préfixe personnalisé » à la connexion du store, ce qui changeait le nom de
 * la variable et rendait le store invisible pour le site.
 */

import "server-only";
import { put } from "@vercel/blob";
import sharp from "sharp";

/** Nom de la variable qui contient le jeton Blob (ou null si aucun). */
export function blobTokenName(): string | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "BLOB_READ_WRITE_TOKEN";
  for (const [k, v] of Object.entries(process.env)) {
    if (k.endsWith("_READ_WRITE_TOKEN") && typeof v === "string" && v.startsWith("vercel_blob_rw_")) {
      return k;
    }
  }
  return null;
}

/** Jeton Blob (ou undefined si aucun store n'est relié au projet). */
export function blobToken(): string | undefined {
  const name = blobTokenName();
  return name ? process.env[name] : undefined;
}

export function blobEnabled(): boolean {
  return Boolean(blobToken());
}

/** Envoie un fichier public sur Blob et renvoie son URL. Jette en cas d'échec. */
export async function putPublic(
  path: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const blob = await put(path, body, {
    access: "public",
    contentType,
    token: blobToken(),
    addRandomSuffix: true,
  });
  return blob.url;
}

/**
 * Recompresse une illustration en JPEG (taille max `maxPx`, qualité `quality`).
 * Une page PNG de 1,5 Mo tombe à ~250 Ko sans perte visible. En cas d'échec,
 * renvoie l'image d'origine.
 */
export async function compressImage(
  input: Buffer,
  mime: string,
  { maxPx = 1600, quality = 86 }: { maxPx?: number; quality?: number } = {},
): Promise<{ bytes: Buffer; mime: string }> {
  try {
    const bytes = await sharp(input)
      .rotate()
      .resize({ width: maxPx, height: maxPx, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    return { bytes, mime: "image/jpeg" };
  } catch {
    return { bytes: input, mime };
  }
}
