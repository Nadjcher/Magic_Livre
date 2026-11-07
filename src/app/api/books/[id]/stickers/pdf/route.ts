/**
 * Planche d'autocollants à découper (vignettes des illustrations, A4).
 * Réservé aux livres payés.
 */

import { NextResponse } from "next/server";
import { pdfResponse } from "@/lib/pdfResponse";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { resolveImages } from "@/lib/imageFetch";
import { renderStickersPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  const params = await props.params;
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  const urls = [acc.story.couvertureUrl, ...acc.story.pages.map((p) => p.imageUrl)];
  return pdfResponse(`${safeFileName(acc.title)}-autocollants.pdf`, async (q) => {
    // Vignettes : une taille modeste suffit largement.
    const petit = { maxPx: Math.min(q.maxPx, 900), quality: q.quality };
    const resolved = await resolveImages(urls, petit);
    const images = resolved.filter((u): u is string => Boolean(u));
    return renderStickersPdf(acc.story, images);
  });
}
