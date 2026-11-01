/**
 * Téléchargement d'un poster A4 du héros (à imprimer pour la chambre).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { pdfResponse } from "@/lib/pdfResponse";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderPosterPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  // Image du poster : couverture, et à défaut (absente OU injoignable) la
  // première illustration de page.
  return pdfResponse(`${safeFileName(acc.title)}-poster.pdf`, async (q) => {
    const image =
      (await fetchAsDataUrl(acc.story.couvertureUrl, q)) ??
      (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl, q));
    const story = {
      ...acc.story,
      couvertureUrl: image,
      pages: acc.story.pages.map((p) => ({ ...p, imageUrl: null })),
    };
    return renderPosterPdf(story, acc.childName);
  });
}
