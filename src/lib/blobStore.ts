/**
 * Accès au stockage Vercel Blob + compression des images.
 *
 * Le jeton est cherché sous son nom standard (BLOB_READ_WRITE_TOKEN) MAIS aussi
 * sous un nom préfixé (ex. STORILOU_IMAGES_READ_WRITE_TOKEN) : Vercel propose un
 * « préfixe personnalisé » à la connexion du store, ce qui changeait le nom de
 * la variable et rendait le store invisible pour le site. Les stores récents
 * n'ont plus de jeton du tout (connexion OIDC + BLOB_STORE_ID).
 */

import "server-only";
import { get, put } from "@vercel/blob";
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

/**
 * Store relié au projet : soit par jeton (ancienne méthode), soit par OIDC
 * (nouvelle méthode Vercel : seule BLOB_STORE_ID est fournie, l'authentification
 * passe par le jeton OIDC du déploiement, géré par @vercel/blob).
 */
export function blobEnabled(): boolean {
  return Boolean(blobToken() || process.env.BLOB_STORE_ID);
}

/** Mode de connexion au store, pour le diagnostic. */
export function blobMode(): "token" | "oidc" | null {
  if (blobToken()) return "token";
  if (process.env.BLOB_STORE_ID) return "oidc";
  return null;
}

/** Préfixe des références vers un fichier d'un store PRIVÉ (lu via le SDK). */
const PRIVE = "vblob:";

export function isPrivateBlobRef(u: string | null | undefined): u is string {
  return typeof u === "string" && u.startsWith(PRIVE);
}

// Accès du store (public ou privé), appris au premier envoi.
let accesStore: "private" | "public" | undefined;

/**
 * Dépose un fichier sur Blob et renvoie sa référence : une URL https pour un
 * store public, ou « vblob:<chemin> » pour un store privé (le fichier n'est
 * alors lisible que par le serveur, qui le sert à son seul propriétaire).
 * Jette en cas d'échec.
 */
export async function putBlob(path: string, body: Buffer, contentType: string): Promise<string> {
  const essai = async (access: "private" | "public") => {
    const blob = await put(path, body, {
      access,
      contentType,
      token: blobToken(),
      addRandomSuffix: true,
    });
    accesStore = access;
    return access === "private" ? `${PRIVE}${blob.pathname}` : blob.url;
  };
  const premier = accesStore ?? "private";
  try {
    return await essai(premier);
  } catch (e) {
    const msg = String(e);
    if (/private access on a public store/i.test(msg)) return essai("public");
    if (/public access on a private store/i.test(msg)) return essai("private");
    throw e;
  }
}

/** Lit un fichier d'un store privé (référence « vblob:… »). Null si absent. */
export async function readPrivateBlob(
  ref: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  try {
    const res = await get(ref.slice(PRIVE.length), { access: "private", token: blobToken() });
    if (!res || !res.stream) return null;
    const bytes = Buffer.from(await new Response(res.stream).arrayBuffer());
    const mime = res.blob?.contentType || "image/jpeg";
    return { bytes, mime };
  } catch (e) {
    console.error("[blob] lecture impossible :", String(e).slice(0, 200));
    return null;
  }
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
