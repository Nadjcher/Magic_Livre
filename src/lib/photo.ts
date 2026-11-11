/** Lecture d'une photo envoyée par le navigateur (data URL) : nettoyée, redimensionnée, en JPEG. Jamais conservée. */

import "server-only";
import sharp from "sharp";

export type Photo = { base64: string; mime: string };

export async function lirePhoto(v: FormDataEntryValue | null): Promise<Photo | undefined> {
  if (typeof v !== "string") return undefined;
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(v);
  if (!m) return undefined;
  const data = m[2] ?? "";
  if (data.length === 0 || data.length > 4_000_000) return undefined;
  try {
    const propre = await sharp(Buffer.from(data, "base64"), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
    return { base64: propre.toString("base64"), mime: "image/jpeg" };
  } catch {
    return undefined; // pas une image valide
  }
}
