/**
 * Images des livres : affichage léger et stockage hors base de données.
 *
 * Historique : sans store Vercel Blob, les illustrations étaient enregistrées en
 * data URL (base64) DANS la base → 15 à 40 Mo par livre, pages trop lourdes
 * pour Vercel (limite 4,5 Mo) et base Neon vite saturée.
 *
 * - `lightenStory` remplace les data URL par une adresse dédiée qui sert UNE
 *   image à la fois (/api/books/{id}/image?i=…) : la page reste légère.
 * - `migrateBookImagesToBlob` déplace les images d'un livre vers Vercel Blob
 *   (si configuré) et allège la base. Appelé à l'ouverture d'un livre.
 */

import "server-only";
import { blobEnabled, compressImage, isPrivateBlobRef, putBlob } from "./blobStore";
import { prisma } from "./prisma";
import type { Story } from "./storySchema";

const isDataUrl = (u: string | null | undefined): u is string =>
  typeof u === "string" && u.startsWith("data:");

/** Adresse servant une image du livre (`cover` ou index de page). */
export function bookImageUrl(bookId: string, which: "cover" | number, version?: string, largeur?: 320 | 480 | 640 | 960): string {
  return `/api/books/${bookId}/image?i=${which}${version ? `&v=${version}` : ""}${largeur ? `&w=${largeur}` : ""}`;
}

/** Empreinte courte d'une référence d'image (change quand l'image est refaite). */
function versionDe(ref: string): string {
  let h = 2166136261;
  for (let i = 0; i < ref.length; i += Math.max(1, Math.floor(ref.length / 400))) {
    h ^= ref.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Image qui ne peut pas être affichée telle quelle par le navigateur. */
const viaRoute = (u: string | null | undefined): boolean => isDataUrl(u) || isPrivateBlobRef(u);

/**
 * Remplace les images embarquées (data URL) ou privées (store Blob privé) par
 * leur adresse dédiée, réservée au propriétaire du livre.
 */
export function lightenStory(story: Story, bookId: string): Story {
  return {
    ...story,
    couvertureUrl: viaRoute(story.couvertureUrl)
      ? bookImageUrl(bookId, "cover", versionDe(story.couvertureUrl as string), 960)
      : story.couvertureUrl,
    pages: story.pages.map((p, i) => ({
      ...p,
      imageUrl: viaRoute(p.imageUrl) ? bookImageUrl(bookId, i, versionDe(p.imageUrl as string), 960) : p.imageUrl,
    })),
  };
}

export { blobEnabled };

async function uploadDataUrl(dataUrl: string, name: string): Promise<string> {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return dataUrl;
  const { bytes, mime } = await compressImage(Buffer.from(m[2] as string, "base64"), m[1] as string);
  const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
  return putBlob(`illustrations/${name}.${ext}`, bytes, mime);
}

/** Recompresse une data URL lourde (PNG ou > 600 Ko) en JPEG léger. */
async function shrinkDataUrl(dataUrl: string): Promise<string> {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return dataUrl;
  const lourde = (m[2] as string).length > 800_000 || !(m[1] as string).includes("jpeg");
  if (!lourde) return dataUrl;
  const { bytes, mime } = await compressImage(Buffer.from(m[2] as string, "base64"), m[1] as string);
  const out = `data:${mime};base64,${bytes.toString("base64")}`;
  return out.length < dataUrl.length ? out : dataUrl;
}

/**
 * Allège un livre dont les images sont encore embarquées en base :
 *  - avec Vercel Blob : les images partent sur Blob (base allégée à ~0) ;
 *  - sans Blob : elles sont recompressées en JPEG (≈ 6× plus léger).
 * Une seule écriture en base. Ne jette jamais : renvoie l'histoire à jour, ou
 * celle d'origine en cas d'échec.
 */
export async function migrateBookImagesToBlob(bookId: string, story: Story): Promise<Story> {
  const aMigrer =
    isDataUrl(story.couvertureUrl) || story.pages.some((p) => isDataUrl(p.imageUrl));
  if (!aMigrer) return story;
  const versBlob = blobEnabled();

  const traiter = async (u: string | null | undefined, nom: string): Promise<string | null> => {
    if (!isDataUrl(u)) return u ?? null;
    return versBlob ? uploadDataUrl(u, nom) : shrinkDataUrl(u);
  };

  try {
    const [couvertureUrl, ...images] = await Promise.all([
      traiter(story.couvertureUrl, `${bookId}-c`),
      ...story.pages.map((p, i) => traiter(p.imageUrl, `${bookId}-${i}`)),
    ]);
    const changed =
      couvertureUrl !== (story.couvertureUrl ?? null) ||
      story.pages.some((p, i) => (images[i] ?? null) !== (p.imageUrl ?? null));
    if (!changed) return story;
    const migrated: Story = {
      ...story,
      couvertureUrl,
      pages: story.pages.map((p, i) => ({ ...p, imageUrl: images[i] ?? null })),
    };
    await prisma.book.update({ where: { id: bookId }, data: { pages: migrated } });
    return migrated;
  } catch (e) {
    console.error("[images] allègement du livre", bookId, "échoué :", String(e).slice(0, 200));
    return story;
  }
}
