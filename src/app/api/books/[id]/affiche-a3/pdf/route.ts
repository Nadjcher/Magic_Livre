/**
 * Produit deluxe « Affiche grand format A3 ».
 * Réservé aux acheteurs de ce produit (sku "affiche_a3").
 */

import { NextResponse } from "next/server";
import { agrandir } from "@/lib/print";
import { pdfResponse } from "@/lib/pdfResponse";
import { getPaidProductStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderPosterA3Pdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  const params = await props.params;
  const acc = await getPaidProductStory(params.id, "affiche_a3");
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  // Grand format : l'illustration est agrandie (≈ 3 400 px) pour une impression
  // nette en A3, une seule fois, puis recompressée selon le palier de taille.
  const source =
    (await fetchAsDataUrl(acc.story.couvertureUrl, { maxPx: 2000, quality: 92 })) ??
    (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl, { maxPx: 2000, quality: 92 }));
  const grande = await agrandir(source);
  return pdfResponse(`${safeFileName(acc.title)}-affiche-a3.pdf`, async (q) => {
    const image = await fetchAsDataUrl(grande, { maxPx: Math.max(q.maxPx * 2, 1800), quality: Math.max(q.quality, 80) });
    return renderPosterA3Pdf(acc.story, acc.childName, image);
  });
}
