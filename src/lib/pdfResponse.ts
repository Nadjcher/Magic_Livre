/**
 * Envoi d'un PDF en respectant la limite de 4,5 Mo des réponses Vercel.
 *
 * Un livre illustré dépassait facilement 15 Mo → Vercel renvoyait une erreur
 * 500. On construit le PDF avec des images recompressées ; s'il reste trop
 * lourd, on recommence avec une compression plus forte. En dernier recours,
 * si Vercel Blob est configuré, le PDF y est déposé (adresse impossible à
 * deviner) et le navigateur est redirigé vers lui.
 */

import "server-only";
import { NextResponse } from "next/server";
import { blobEnabled, putPublic } from "./blobStore";
import type { ImgQuality } from "./imageFetch";

/** Nom de fichier sans accents ni caractères spéciaux (en-tête HTTP). */
function asciiName(name: string): string {
  return name.normalize("NFD").replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "") || "livre.pdf";
}

const LIMITE = 4_200_000; // marge sous les 4,5 Mo de Vercel
const PALIERS: ImgQuality[] = [
  { maxPx: 1600, quality: 84 },
  { maxPx: 1200, quality: 74 },
  { maxPx: 900, quality: 66 },
];

export async function pdfResponse(
  fileName: string,
  build: (q: ImgQuality) => Promise<Buffer>,
): Promise<Response> {
  let pdf: Buffer | null = null;
  for (const q of PALIERS) {
    pdf = await build(q);
    if (pdf.length <= LIMITE) break;
  }
  const bytes = pdf as Buffer;

  if (bytes.length > LIMITE && blobEnabled()) {
    try {
      const url = await putPublic(`pdf/${fileName}`, bytes, "application/pdf");
      return NextResponse.redirect(url, 303);
    } catch (e) {
      console.error("[pdf] dépôt Blob échoué :", String(e).slice(0, 200));
    }
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // Nom ASCII + nom UTF-8 : un accent brut dans l'en-tête fait planter Node.
      "Content-Disposition": `attachment; filename="${asciiName(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
