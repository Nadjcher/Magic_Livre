/**
 * Produit deluxe « Affiche grand format A3 ».
 * Réservé aux acheteurs de ce produit (sku "affiche_a3").
 */

import { NextResponse } from "next/server";
import { pdfResponse } from "@/lib/pdfResponse";
import { getPaidProductStory, safeFileName } from "@/lib/bookAccess";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { renderPosterA3Pdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidProductStory(params.id, "affiche_a3");
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  return pdfResponse(`${safeFileName(acc.title)}-affiche-a3.pdf`, async (q) => {
    const image =
      (await fetchAsDataUrl(acc.story.couvertureUrl, q)) ??
      (await fetchAsDataUrl(acc.story.pages[0]?.imageUrl, q));
    return renderPosterA3Pdf(acc.story, acc.childName, image);
  });
}
