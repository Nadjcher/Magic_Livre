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
import { put } from "@vercel/blob";
import { prisma } from "./prisma";
import type { Story } from "./storySchema";

const isDataUrl = (u: string | null | undefined): u is string =>
  typeof u === "string" && u.startsWith("data:");

/** Adresse servant une image du livre (`cover` ou index de page). */
export function bookImageUrl(bookId: string, which: "cover" | number): string {
  return `/api/books/${bookId}/image?i=${which}`;
}

/** Remplace les images embarquées (data URL) par leur adresse dédiée. */
export function lightenStory(story: Story, bookId: string): Story {
  return {
    ...story,
    couvertureUrl: isDataUrl(story.couvertureUrl)
      ? bookImageUrl(bookId, "cover")
      : story.couvertureUrl,
    pages: story.pages.map((p, i) => ({
      ...p,
      imageUrl: isDataUrl(p.imageUrl) ? bookImageUrl(bookId, i) : p.imageUrl,
    })),
  };
}

/** Indique si un store Vercel Blob est configuré. */
export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function uploadDataUrl(dataUrl: string, name: string): Promise<string> {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return dataUrl;
  const mime = m[1] as string;
  const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
  const blob = await put(`illustrations/${name}.${ext}`, Buffer.from(m[2] as string, "base64"), {
    access: "public",
    contentType: mime,
  });
  return blob.url;
}

/**
 * Déplace vers Vercel Blob les images encore embarquées d'un livre, puis met à
 * jour le livre en une seule écriture. Sans effet si Blob n'est pas configuré
 * ou si le livre n'a plus d'image embarquée. Ne jette jamais.
 * Renvoie l'histoire à jour (ou celle d'origine en cas d'échec).
 */
export async function migrateBookImagesToBlob(bookId: string, story: Story): Promise<Story> {
  if (!blobEnabled()) return story;
  const aMigrer =
    isDataUrl(story.couvertureUrl) || story.pages.some((p) => isDataUrl(p.imageUrl));
  if (!aMigrer) return story;

  try {
    const stamp = Date.now();
    const [couvertureUrl, ...images] = await Promise.all([
      isDataUrl(story.couvertureUrl)
        ? uploadDataUrl(story.couvertureUrl, `${bookId}-c-${stamp}`)
        : Promise.resolve(story.couvertureUrl ?? null),
      ...story.pages.map((p, i) =>
        isDataUrl(p.imageUrl)
          ? uploadDataUrl(p.imageUrl, `${bookId}-${i}-${stamp}`)
          : Promise.resolve(p.imageUrl ?? null),
      ),
    ]);
    const migrated: Story = {
      ...story,
      couvertureUrl,
      pages: story.pages.map((p, i) => ({ ...p, imageUrl: images[i] ?? null })),
    };
    await prisma.book.update({ where: { id: bookId }, data: { pages: migrated } });
    return migrated;
  } catch (e) {
    console.error("[blob] migration du livre", bookId, "échouée :", String(e).slice(0, 200));
    return story;
  }
}
